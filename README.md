# AvatarAI — Talking Avatar Studio

A full-stack, local AI studio application that transforms static portrait photos into realistic, lip-synced talking avatar videos using ultra-realistic neural text-to-speech and AI head animation.

---

## 🌟 Key Features

- **📸 Instant Avatar Upload & Face Animation**: Upload any portrait photo or choose from curated presets. The system detects facial landmarks and animates realistic lip movements, expressions, and natural head motion.
- **🎙️ Ultra-Realistic Neural Speech Synthesis**:
  - Studio-grade voices via Edge Neural TTS (`Guy`, `Jenny`, `Prabhat` for Indian English, `Neerja`).
  - Offline local fallback using the lightweight Kokoro ONNX model (82M parameters).
  - Fast generation (< 2 seconds for full phrases).
- **🎬 Dual Animation Engine**:
  - **SadTalker Deep Animation**: 3D Morphable Model (BFM) + Exp_Pca facial landmark motion generation.
  - **Smart Fallback Engine**: Dynamic zoom/pan motion video generation with perfect audio sync if GPU or timeout occurs.
- **💻 Modern Dark/Light Studio UI**:
  - React + Vite responsive frontend with live script editor, voice selector, avatar gallery, and real-time generation progress monitor.
  - Automatic backend health tracking and instant reconnect.
- **⚡ Production-Ready Windows & Linux Scripts**: One-click launchers (`start_all.bat`, `run_backend.bat`, `run_frontend.bat`).

---

## 🛠️ Architecture & Tech Stack

### Frontend
- **Framework**: React 19, Vite
- **Styling**: Modern dark mode UI, CSS Grid & Flexbox, sleek glassmorphism
- **API Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.12 / 3.11)
- **Speech Engine**: Microsoft Edge-TTS + Kokoro ONNX (82M parameters)
- **Face Animation Engine**: SadTalker (PyTorch + FaceXLib + 3DMM BFM Fitting) + FFmpeg
- **Audio Processing**: SoundFile, PyDub, Librosa, Soxr

---

## 🚀 Getting Started

### 1. Prerequisites
- **Python**: 3.10, 3.11, or 3.12
- **Node.js**: 18+ and npm
- **FFmpeg**: Installed and added to system PATH

### 2. Quick Launch (Windows)
Double-click `start_all.bat` or run:
```bash
.\start_all.bat
```
This automatically launches both the FastAPI backend (`http://127.0.0.1:8000`) and the Vite frontend (`http://localhost:5173`).

### 3. Manual Launch

#### Backend:
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 📁 Repository Structure

```
AvatarCopy-main/
├── backend/
│   ├── engines/
│   │   └── SadTalker/          # SadTalker inference pipeline
│   ├── models/                 # Lightweight ONNX model directory
│   ├── routers/                # FastAPI endpoint routers
│   ├── services/
│   │   ├── avatar_service.py   # SadTalker & video synthesis pipeline
│   │   ├── tts_service.py      # Edge-TTS & Kokoro TTS engine
│   │   └── project_service.py  # Project history & state management
│   ├── uploads/                # Local storage for avatars and outputs
│   ├── main.py                 # FastAPI application entrypoint
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/                    # React Studio interface
│   ├── package.json            # Frontend packages & scripts
│   └── vite.config.js          # Vite configuration
├── start_all.bat               # One-click full-stack launcher
├── run_backend.bat             # Backend launcher script
├── run_frontend.bat            # Frontend launcher script
└── README.md                   # Project documentation
```

---

## 🛡️ License
MIT License. Built for local AI experimentation and content creation.
