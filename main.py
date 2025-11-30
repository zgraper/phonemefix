# main.py
import io
import json
from typing import Optional

import torch
import soundfile as sf
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import (
    AutoProcessor,
    AutoModelForCTC,
    AutoTokenizer,
    AutoModelForSeq2SeqLM,
)

# ============================================================
# 0. IPA utilities (normalization + helpers)
# ============================================================

# basic sets – extend as needed
VOWELS = {
    "a", "e", "i", "o", "u",
    "æ", "ʌ", "ɪ", "ʊ", "ə", "ɛ", "ɔ", "ɑ", "ɜ", "ɒ"
}
NASALS = {"n", "m", "ŋ"}


def normalize_ipa(ipa_seq: str) -> str:
    """
    Normalize espeak-style / noisy IPA from wav2vec2 into a
    smaller, more canonical inventory that matches what T5 saw
    during fine-tuning.
    """
    toks = ipa_seq.split()
    norm = []

    for p in toks:
        # strip common stress / prosody marks
        p = p.replace("ˈ", "").replace("ˌ", "")

        # collapse common diacritics into base symbols
        p = p.replace("tʰ", "t").replace("t̠", "t")
        p = p.replace("d̠", "d")
        p = p.replace("ɹ̩", "ɹ").replace("l̩", "l")
        p = p.replace("̃", "")  # nasalization offload

        # you can extend this map as needed
        norm.append(p)

    return " ".join(norm)


def collapse_repeats(tokens):
    """
    Collapse immediate repeats of the same token (except '|'),
    which helps with lengthened consonants/vowels in child speech.
    """
    if not tokens:
        return tokens

    out = [tokens[0]]
    for t in tokens[1:]:
        if t == out[-1] and t != "|":
            continue
        out.append(t)
    return out


# -------------------------------------------------------------------
# 1. FastAPI setup + CORS
# -------------------------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for local dev; tighten later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------------
# 2. Load models once at startup
# -------------------------------------------------------------------
WAV2VEC2_ID = "facebook/wav2vec2-lv-60-espeak-cv-ft"
IPA2TEXT_ID = "zanegraper/t5-small-ipa-phoneme-to-text"  # your model

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Loading wav2vec2 model...")
w2v_processor = AutoProcessor.from_pretrained(WAV2VEC2_ID)
w2v_model = AutoModelForCTC.from_pretrained(WAV2VEC2_ID).to(device)

print("Loading IPA→text T5 model...")
t5_tokenizer = AutoTokenizer.from_pretrained(
    IPA2TEXT_ID,
    use_fast=False,
)
t5_model = AutoModelForSeq2SeqLM.from_pretrained(IPA2TEXT_ID).to(device)


# -------------------------------------------------------------------
# 3. Rule config + response schemas (unchanged)
# -------------------------------------------------------------------
class GlidingRules(BaseModel):
    w_to_r: bool = False
    l_to_w: bool = False
    r_to_w: bool = False


class StoppingRules(BaseModel):
    s_to_t: bool = False
    z_to_d: bool = False


class RuleConfig(BaseModel):
    gliding: GlidingRules
    stopping: StoppingRules
    cluster_reduction: bool


class PipelineResponse(BaseModel):
    raw_ipa: str
    corrected_ipa: str
    final_text: str
    rules_applied: RuleConfig
    wav2vec2_model_used: Optional[str] = None
    t5_model_used: Optional[str] = None


# -------------------------------------------------------------------
# 4. Helper: run wav2vec2 on audio -> phoneme string (mostly unchanged)
# -------------------------------------------------------------------
def transcribe_to_ipa(audio_bytes: bytes) -> str:
    # Read audio as mono 16k float32
    audio_io = io.BytesIO(audio_bytes)
    audio, sr = sf.read(audio_io)

    if audio.ndim > 1:
        # convert to mono
        audio = audio.mean(axis=1)

    # NOTE: ideally resample to 16k here if sr != 16000

    inputs = w2v_processor(
        audio,
        sampling_rate=sr,
        return_tensors="pt",
        padding=True,
    )

    with torch.no_grad():
        logits = w2v_model(**{k: v.to(device) for k, v in inputs.items()}).logits

    pred_ids = torch.argmax(logits, dim=-1)
    text = w2v_processor.batch_decode(pred_ids)[0]

    # espeak-style phonemes; we'll normalize downstream
    return text.strip()


# -------------------------------------------------------------------
# 5. Helper: apply phonological rules on IPA string (optimized)
# -------------------------------------------------------------------
def apply_rules(raw_ipa: str, rules: RuleConfig) -> str:
    """
    Apply phonological corrections in a token-aware way.
    Assumes raw_ipa already contains '|' boundaries where present.
    """
    toks = raw_ipa.split()
    out = []

    for i, p in enumerate(toks):
        # Keep boundaries untouched
        if p == "|":
            out.append(p)
            continue

        # Lookahead vowel for some gliding contexts
        next_sym = toks[i + 1] if i + 1 < len(toks) else None
        next_is_vowel = next_sym in VOWELS if next_sym is not None else False

        # -------------------------
        # GLIDING (correction: child's /w/ -> adult target)
        # -------------------------

        # Child says "wabbit" for "rabbit":
        # underlying /ɹ/ is realized as [w]; we map w -> ɹ
        if p == "w":
            # /l/ → /w/ pattern: child uses w for l → correct w -> l
            if rules.gliding.l_to_w and next_is_vowel:
                p = "l"
            # /r/ → /w/ pattern: child uses w for r → correct w -> ɹ
            elif (rules.gliding.w_to_r or rules.gliding.r_to_w) and next_is_vowel:
                p = "ɹ"

        # -------------------------
        # STOPPING (correction: child's stop -> adult fricative)
        # -------------------------
        # /s/ → /t/: child says "tun" for "sun" → t -> s
        if rules.stopping.s_to_t and p == "t":
            p = "s"

        # /z/ → /d/: child says "doo" for "zoo" → d -> z
        if rules.stopping.z_to_d and p == "d":
            p = "z"

        out.append(p)

    # -------------------------
    # CLUSTER REDUCTION
    # Example: child reduces /sp/ to [p]; we re-insert 's' by
    # default right now we only *remove* 's' if user wants
    # to simulate cluster reduction. Here we're correcting:
    # we want to REMOVE extra 's' if modeling the child,
    # but since this is *correction*, we usually shouldn't
    # add new 's'. To follow your original code's intent,
    # we *insert* an 's' before 'p' when enabled.
    # -------------------------

    if rules.cluster_reduction:
        # Based on your original: " p" -> " s p" (add /s/ before /p/)
        corrected = []
        for i, p in enumerate(out):
            # don't try to manipulate boundaries
            if p == "|" or not corrected:
                corrected.append(p)
                continue

            # if we see a 'p' and previous is not 's' or '|', insert 's' before it
            if p == "p" and corrected[-1] not in ("s", "|"):
                corrected.append("s")
                corrected.append("p")
            else:
                corrected.append(p)
        out = corrected

    # Collapse any accidental repeats (except '|')
    out = collapse_repeats(out)

    return " ".join(out)


# -------------------------------------------------------------------
# 6. Helper: IPA -> text via T5 (unchanged)
# -------------------------------------------------------------------
def decode_ipa_to_text(ipa: str) -> str:
    inputs = t5_tokenizer(
        ipa,
        return_tensors="pt",
        padding=True,
        truncation=True,
    )
    with torch.no_grad():
        outputs = t5_model.generate(
            **{k: v.to(device) for k, v in inputs.items()},
            max_length=64,
            num_beams=4,
            early_stopping=True,
        )
    text = t5_tokenizer.decode(outputs[0], skip_special_tokens=True)
    return text.strip()


# -------------------------------------------------------------------
# 7. Main pipeline endpoint (wire-up remains the same)
# -------------------------------------------------------------------
@app.post("/pipeline", response_model=PipelineResponse)
async def run_pipeline(
    file: UploadFile = File(...),
    rules: str = Form(...),  # JSON string from frontend
):
    # Parse rules JSON
    rules_dict = json.loads(rules)
    rule_cfg = RuleConfig(**rules_dict)

    # Read audio
    audio_bytes = await file.read()

    # 1) Audio -> phonemes
    raw_ipa = transcribe_to_ipa(audio_bytes)

    # 1.1) Normalize IPA inventory
    normalized_ipa = normalize_ipa(raw_ipa)

    # 2) Apply phonological rules
    corrected_ipa = apply_rules(normalized_ipa, rule_cfg)

    # 3) IPA -> text
    final_text = decode_ipa_to_text(corrected_ipa)

    return PipelineResponse(
        raw_ipa=normalized_ipa,
        corrected_ipa=corrected_ipa,
        final_text=final_text,
        rules_applied=rule_cfg,
        wav2vec2_model_used=WAV2VEC2_ID,
        t5_model_used=IPA2TEXT_ID,
    )
