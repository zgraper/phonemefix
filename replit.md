# PhonemeFix - Child Speech Correction & Translation Research

## Overview
PhonemeFix is a full-stack AI application for analyzing and correcting child speech patterns. It uses machine learning models to:
- Convert audio to phonemes using wav2vec2
- Apply phonological correction rules for common child speech patterns
- Translate corrected phonemes back to text using T5 models

This is a GitHub import that has been configured to run in the Replit environment.

**Current Status**: Fully functional and running in development mode.

**Version**: v1.0.0-beta

## Project Architecture

### Frontend (React + Vite + TypeScript)
- **Port**: 5000 (configured for Replit webview)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **UI Components**: Custom components with Tailwind CSS (via CDN)
- **Key Features**:
  - Audio file upload (WAV, MP3, M4A, FLAC, OGG - max 25MB)
  - Configurable phonological correction rules (Gliding, Stopping, Cluster Reduction, Final Consonant Deletion)
  - Real-time results display showing raw IPA, corrected IPA, and final text

### Backend (Python FastAPI)
- **Port**: 8000 (localhost only)
- **Framework**: FastAPI with Uvicorn
- **AI/ML Stack**:
  - PyTorch 2.9
  - Transformers 4.44
  - facebook/wav2vec2-lv-60-espeak-cv-ft (audio to phonemes)
  - zanegraper/t5-small-ipa-phoneme-to-text (IPA to text)
- **System Dependencies**:
  - espeak-ng (for phonemization)
  - PHONEMIZER_ESPEAK_LIBRARY environment variable configured

### API Communication
- Frontend communicates with backend via HTTP REST API
- Endpoint: `POST /pipeline` - accepts audio file + rules configuration
- Returns: raw IPA, corrected IPA, final text, and applied rules

## Recent Changes (November 27, 2025)
- ✅ Configured for Replit environment
- ✅ Updated Vite config to use port 5000 with HMR support
- ✅ Changed API URL from external GitHub Codespaces to localhost:8000
- ✅ Installed Python 3.11 and all required dependencies
- ✅ Installed espeak-ng system dependency
- ✅ Set PHONEMIZER_ESPEAK_LIBRARY environment variable
- ✅ Configured both frontend and backend workflows
- ✅ Set up static deployment configuration
- ✅ Added comprehensive .gitignore for Python
- ✅ Added individual subrule selections for Gliding (/w/→/r/, /l/→/w/, /r/→/w/) and Stopping (/s/→/t/, /z/→/d/)
- ✅ Updated backend to process individual correction rules instead of category-wide toggles
- ✅ Removed Final Consonant Deletion rule from interface
- ✅ Removed "Select All" buttons - now using individual checkboxes only
- ✅ Improved backend with IPA normalization, token-aware rule processing, and beam search decoding
- ✅ Removed heuristic boundary approximation (research showed it worsened results)
- ✅ Added Vite proxy configuration to fix network errors

## Development

### Running Locally
Both workflows are configured and auto-start:
1. **Backend API** - Runs Python FastAPI server on port 8000
2. **Frontend** - Runs Vite dev server on port 5000

The application should be accessible via the Replit webview.

### Environment Variables
- `PHONEMIZER_ESPEAK_LIBRARY`: Set to `/nix/store/.../libespeak-ng.so` (development environment)
  - Required for the phonemizer library to find espeak-ng

Note: The original GEMINI_API_KEY mentioned in the README is not used in the current implementation.

## Deployment
Configured as a static deployment:
- Build command: `npm run build`
- Public directory: `dist`
- The frontend will be built and served as static files

## Known Issues & Notes
- The ML models are downloaded on first startup, which can take time
- Frontend uses Tailwind CSS via CDN (should be converted to PostCSS for production)
- WebSocket HMR warnings are expected in the Replit environment
- The backend models use CPU by default (no GPU available in standard Replit)

## Tech Stack Summary
**Frontend**: React 19, TypeScript, Vite 6, Lucide Icons  
**Backend**: Python 3.11, FastAPI, PyTorch, Transformers, Phonemizer  
**System**: NixOS environment with espeak-ng  
**AI Models**: HuggingFace (wav2vec2, T5)
