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

# ------------------------------------------------------------
# Boundary Heuristic (IPA segmentation approximation)
# ------------------------------------------------------------
def approximate_boundaries(ipa_seq: str) -> str:
    tokens = ipa_seq.split()
    if len(tokens) <= 1:
        return ipa_seq

    out = []

    VOWELS = ["a","e","i","o","u","æ","ʌ","ɪ","ʊ","ə"]
    NASALS = ["n","m"]
    VOICELESS_STOPS = ["p","t","k"]

    for i, tok in enumerate(tokens[:-1]):
        nxt = tokens[i + 1]
        out.append(tok)

        # Heuristic: vowel/nasal → voiceless stop triggers a boundary
        if tok in VOWELS + NASALS and nxt in VOICELESS_STOPS:
            out.append("|")

    out.append(tokens[-1])
    return " ".join(out)

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
    use_fast=False)
t5_model = AutoModelForSeq2SeqLM.from_pretrained(IPA2TEXT_ID).to(device)


# -------------------------------------------------------------------
# 3. Rule config + response schemas (for clarity)
# -------------------------------------------------------------------
class RuleConfig(BaseModel):
    gliding: bool
    stopping: bool
    cluster_reduction: bool
    final_consonant_deletion: bool


class PipelineResponse(BaseModel):
    raw_ipa: str
    corrected_ipa: str
    final_text: str
    rules_applied: RuleConfig
    wav2vec2_model_used: Optional[str] = None


# -------------------------------------------------------------------
# 4. Helper: run wav2vec2 on audio -> phoneme string
# -------------------------------------------------------------------
def transcribe_to_ipa(audio_bytes: bytes) -> str:
    # Read audio as mono 16k float32
    audio_io = io.BytesIO(audio_bytes)
    audio, sr = sf.read(audio_io)

    if sr != 16000:
        # soundfile will give arrays; w2v expects 16k; in ideal world, resample
        # For now, assume your input is 16k. If not, we should resample.
        pass

    if audio.ndim > 1:
        # convert to mono
        audio = audio.mean(axis=1)

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

    # This model outputs espeak-style phonemes; we’ll treat as "raw IPA-like"
    return text.strip()


# -------------------------------------------------------------------
# 5. Helper: apply phonological rules on IPA string
# -------------------------------------------------------------------
def apply_rules(raw_ipa: str, rules: RuleConfig) -> str:
    corrected = raw_ipa

    # NOTE: these are simple, placeholder transforms; refine later.
    # They are written in a way that won't crash even if patterns don't appear.

    if rules.gliding:
        # Example: child "wabbit" -> target "rabbit":
        # If a /w/ occurs before a low front vowel /æ/ or /ɛ/, replace with /ɹ/
        corrected = corrected.replace("w æ", "ɹ æ")
        corrected = corrected.replace("w ɛ", "ɹ ɛ")

    if rules.stopping:
        # Example: /s/ -> /t/ fixed to /s/, /z/ -> /d/ fixed to /z/
        corrected = corrected.replace("t", "s")
        corrected = corrected.replace("d", "z")

    if rules.cluster_reduction:
        # Very naive: try to restore "sp" clusters if we only see "p" at word onset
        # Placeholder – in real work you'd need syllable/word boundaries.
        corrected = corrected.replace(" p", " s p")

    if rules.final_consonant_deletion:
        # Placeholder: if word ends in vowel, try to restore a final /t/ in specific patterns
        # (e.g., "ca" -> "cat" would be text-level, not IPA-level; this is just a stub.)
        pass

    return corrected


# -------------------------------------------------------------------
# 6. Helper: IPA -> text via T5
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
        )
    text = t5_tokenizer.decode(outputs[0], skip_special_tokens=True)
    return text.strip()


# -------------------------------------------------------------------
# 7. Main pipeline endpoint
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

    # 1.5 Insert approximate boundaries
    raw_ipa_with_bounds = approximate_boundaries(raw_ipa)

    # 2) Apply phonological rules
    corrected_ipa = apply_rules(raw_ipa_with_bounds, rule_cfg)

    # 3) IPA -> text
    final_text = decode_ipa_to_text(corrected_ipa)

    return PipelineResponse(
        raw_ipa=raw_ipa_with_bounds,
        corrected_ipa=corrected_ipa,
        final_text=final_text,
        rules_applied=rule_cfg,
        wav2vec2_model_used=WAV2VEC2_ID,
    )
