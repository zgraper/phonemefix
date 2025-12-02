# PhonemeFix

**Child Speech Correction & Translation Research Application**

---

## About This Project

PhonemeFix is a full-stack AI application developed as part of **Zane Graper's Capstone Project** for the **Master of Science in Artificial Intelligence** degree at the **University of the Cumberlands**.

This research application analyzes audio recordings of child speech, applies configurable phonological correction rules to address common developmental speech patterns, and translates the corrected phonemes back to readable text using machine learning models.

> **Disclaimer:** This application is intended for **research purposes only** and is not designed for clinical or diagnostic use.

---

## Features

- **Audio-to-Phoneme Transcription**: Converts speech audio to IPA (International Phonetic Alphabet) phonemes using Facebook's wav2vec2 model
- **Phonological Correction Rules**: Applies configurable correction rules for common child speech patterns:
  - **Gliding**: /w/ to /r/, /l/ to /w/, /r/ to /w/
  - **Stopping**: /s/ to /t/, /z/ to /d/
  - **Cluster Reduction**: Restores reduced consonant clusters
- **Phoneme-to-Text Translation**: Converts corrected IPA phonemes to readable English text using a fine-tuned T5 model
- **IPA Normalization**: Normalizes phoneme output for consistent processing
- **Interactive Web Interface**: User-friendly interface for uploading audio and configuring correction rules

---

## Architecture

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS
- **Port**: 5000

### Backend
- **Framework**: Python FastAPI with Uvicorn
- **Port**: 8000

### Machine Learning Models
| Model | Purpose | Source |
|-------|---------|--------|
| `facebook/wav2vec2-lv-60-espeak-cv-ft` | Audio to IPA phonemes | HuggingFace |
| `zanegraper/t5-small-ipa-phoneme-to-text` | IPA to English text | HuggingFace |

### System Dependencies
- Python 3.11+
- Node.js 20+
- espeak-ng (phonemization library)

---

## Installation

### Prerequisites
- Python 3.11 or higher
- Node.js 20 or higher
- espeak-ng system library

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/phonemefix.git
   cd phonemefix
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node.js dependencies**
   ```bash
   npm install
   ```

4. **Set up espeak-ng** (Linux/macOS)
   ```bash
   # Ubuntu/Debian
   sudo apt-get install espeak-ng
   
   # macOS
   brew install espeak-ng
   ```

5. **Configure environment variable** (if needed)
   ```bash
   export PHONEMIZER_ESPEAK_LIBRARY=/path/to/libespeak-ng.so
   ```

---

## Usage

### Running the Application

1. **Start the backend API server**
   ```bash
   uvicorn main:app --host localhost --port 8000 --reload
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   
   Open your browser and navigate to `http://localhost:5000`

### Using the Application

1. Upload an audio file (supported formats: WAV, MP3, M4A, FLAC, OGG - max 25MB)
2. Select the phonological correction rules to apply
3. Click "Run Pipeline" to process the audio
4. View the results:
   - Raw IPA transcription from wav2vec2
   - Corrected IPA after applying rules
   - Final decoded English text

---

## API Reference

### POST `/pipeline`

Processes an audio file through the speech correction pipeline.

**Request:**
- `file`: Audio file (multipart/form-data)
- `rules`: JSON string containing rule configuration

**Response:**
```json
{
  "raw_ipa": "string",
  "corrected_ipa": "string", 
  "final_text": "string",
  "rules_applied": {
    "gliding": {
      "w_to_r": false,
      "l_to_w": false,
      "r_to_w": false
    },
    "stopping": {
      "s_to_t": false,
      "z_to_d": false
    },
    "cluster_reduction": false
  },
  "wav2vec2_model_used": "string",
  "t5_model_used": "string"
}
```

---

## Technology Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS |
| Backend | Python 3.11, FastAPI, Uvicorn |
| ML/AI | PyTorch, HuggingFace Transformers |
| Audio Processing | SoundFile, Phonemizer |
| Models | wav2vec2-lv-60-espeak-cv-ft, T5-small (fine-tuned) |

---

## Research Context

This project explores the application of transformer-based models for:

1. **Acoustic-to-Phoneme Conversion**: Using self-supervised speech representations (wav2vec2) trained on multilingual data with espeak phoneme targets
2. **Phonological Pattern Correction**: Implementing rule-based corrections for common child speech development patterns
3. **Phoneme-to-Text Translation**: Fine-tuning sequence-to-sequence models (T5) for IPA-to-English translation

### Key Research Findings

- Token-aware rule processing provides more accurate phonological corrections than simple string replacement
- IPA normalization (removing stress marks and collapsing diacritics) improves T5 model performance
- Heuristic boundary approximation was found to worsen results and was removed from the pipeline

---

## File Structure

```
phonemefix/
├── main.py                 # FastAPI backend server
├── App.tsx                 # React application root
├── types.ts                # TypeScript type definitions
├── constants.ts            # Application constants
├── vite.config.ts          # Vite configuration
├── components/
│   ├── FileUpload.tsx      # Audio file upload component
│   ├── RuleSettings.tsx    # Phonological rules configuration
│   └── ResultsDisplay.tsx  # Results display component
├── services/
│   └── api.ts              # API service layer
└── README.md               # This file
```

---

## License

This project is developed for academic research purposes as part of a Master's Capstone Project at the University of the Cumberlands.

---

## Author

**Zane Graper**  
Master of Science in Artificial Intelligence  
University of the Cumberlands

---

## Acknowledgments

- [HuggingFace](https://huggingface.co/) for hosting transformer models
- [Facebook AI Research](https://ai.facebook.com/) for the wav2vec2 model
- University of the Cumberlands for academic support and guidance
