# AvatarAI — Talking Avatar Studio 🎬

> Transform any portrait photo into a realistic, lip-synced talking avatar video with ultra-realistic neural speech synthesis and local AI face animation.

---

## 🌟 Overview & Highlights

- **📸 Instant Avatar Creation**: Upload any face/portrait image or select from gallery presets. The pipeline automatically detects facial landmarks and generates natural head movement, blinking, and lip-syncing.
- **🎙️ Ultra-Realistic Studio Voices (Zero Robotic Tone)**:
  - **`Guy`** *(Ultra-Realistic, Natural American Male)* — **Default**
  - **`Jenny`** *(Natural, Friendly American Female)*
  - **`Prabhat`** *(Natural Indian-English Male)*
  - **`Neerja`** *(Expressive Indian-English Female)*
  - *Fallback Local Kokoro ONNX Voices*: Sofia, James, Emma (82M offline parameter model).
- **🧠 Dual AI Engine**:
  - **SadTalker 3D Morphable Model (BFM)**: Full face landmark animation and lip synchronization.
  - **Smart Fallback Engine**: High-fidelity dynamic camera motion (zoom/pan) with sub-second audio sync if deep render times out.
- **💻 Modern Studio Interface**:
  - Dark/Light mode React 19 UI with live script editor, voice auditioning, avatar selector, and real-time generation progress.
- **⚡ Cross-Platform**: Fully configured for **macOS (Apple Silicon M1/M2/M3/M4 & Intel)**, **Windows 10/11**, and **Linux**.

---

## 🍎 Quick Start Guide for macOS (MacBook Pro / Air)

Follow these simple steps in your **Terminal**.

### Step 1: Install System Prerequisites (Homebrew)

If you don't have [Homebrew](https://brew.sh) installed yet, install it by pasting this into Terminal:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Then install **Python 3.11**, **Node.js**, and **FFmpeg**:
```bash
brew install python@3.11 node ffmpeg
```

---

### Step 2: Clone the Repository & Run Automated Setup

In Terminal, navigate to your desired directory and run:

```bash
# 1. Clone the repository
git clone https://github.com/29Sandesh/AvatarAI.git
cd AvatarAI

# 2. Make scripts executable
chmod +x *.sh

# 3. Run the automated 1-click setup script
./setup_mac.sh
```

> **What `./setup_mac.sh` does automatically:**
> 1. Verifies `python3`, `node`, `npm`, and `ffmpeg`.
> 2. Creates and activates the Python virtual environment (`backend/venv`).
> 3. Installs all backend Python packages (`pip install -r backend/requirements.txt`).
> 4. Installs frontend packages (`npm install` inside `frontend/`).
> 5. Downloads all required AI models and checkpoints into their exact folders (`python3 backend/download_models.py`).

---

### Step 3: Launch AvatarAI Studio

Once setup finishes, start both the backend and frontend with **one command**:

```bash
./start_all.sh
```

Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

---

### Manual Launch on macOS (Alternative)

If you prefer to run the backend and frontend in separate Terminal tabs:

#### Tab 1 — Backend:
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 download_models.py
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

#### Tab 2 — Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🪟 Quick Start Guide for Windows

1. **Prerequisites**:
   - Python 3.10, 3.11, or 3.12 (check "Add Python to PATH" during installation)
   - Node.js 18+ ([nodejs.org](https://nodejs.org))
   - FFmpeg installed and in your system PATH

2. **Setup & Download Models**:
   Open PowerShell or Command Prompt in the project folder:
   ```powershell
   pip install -r backend\requirements.txt
   npm --prefix frontend install
   python backend\download_models.py
   ```

3. **Launch**:
   Double-click `start_all.bat` or run:
   ```powershell
   .\start_all.bat
   ```
   Or run individually:
   - Backend: `.\run_backend.bat`
   - Frontend: `.\run_frontend.bat`

---

## 🧠 Downloading AI Model Checkpoints Manually

The project comes with a built-in cross-platform downloader (`backend/download_models.py`).
To download or verify all checkpoints at any time, run:

```bash
python3 backend/download_models.py
```

### Models Downloaded:
| Model Component | Target Location | Description |
|---|---|---|
| **Kokoro ONNX** | `backend/models/kokoro-v1.0.onnx` | 82M offline TTS model |
| **Kokoro Voices** | `backend/models/voices-v1.0.bin` | Voice embeddings |
| **SadTalker 256** | `backend/engines/SadTalker/checkpoints/SadTalker_V0.0.2_256.safetensors` | Facial animation model |
| **SadTalker Mapping** | `backend/engines/SadTalker/checkpoints/mapping_*.pth.tar` | Audio-to-expression mapping |
| **3DMM BFM Fitting** | `backend/engines/SadTalker/checkpoints/BFM_Fitting/` | 3D Morphable Model basis |
| **FaceXLib Weights** | `backend/engines/SadTalker/gfpgan/weights/` | Facial alignment & landmark detection |

---

## 🎯 How to Use the Studio

1. **Select / Upload Avatar**:
   - In the left sidebar, select **Avatar**.
   - Pick an existing preset or click **+ Upload Avatar** to upload a clear portrait photo of anyone.
2. **Choose Voice**:
   - Click **Voice** in the toolbar.
   - Choose **Guy (Ultra-Realistic)**, **Jenny**, **Prabhat**, or **Neerja**.
   - Click the `▶` play button next to any voice to preview how natural it sounds.
3. **Write Your Script**:
   - Type or paste your desired script into the **Script Editor** box on the Avatar screen.
   - (Optional) Click **✦ AI Script Writer** under AI Tools to auto-generate sample scripts.
4. **Generate Video**:
   - Click the glowing **⚡ Generate Video** button in the top right.
   - Watch the live progress bar as it generates speech audio, detects facial landmarks, and renders the talking video.
   - Play or download your completed MP4 video!

---

## 📁 Repository Structure

```
AvatarAI/
├── setup_mac.sh                # 🍎 1-Click Automated Setup for MacBook / macOS
├── start_all.sh                # 🍎 Launch both servers on macOS / Linux
├── run_backend.sh              # 🍎 Launch backend only on macOS / Linux
├── run_frontend.sh             # 🍎 Launch frontend only on macOS / Linux
├── start_all.bat               # 🪟 1-Click Launch for Windows
├── run_backend.bat             # 🪟 Launch backend only on Windows
├── run_frontend.bat            # 🪟 Launch frontend only on Windows
├── backend/
│   ├── download_models.py      # Automated cross-platform model downloader
│   ├── engines/
│   │   └── SadTalker/          # SadTalker 3D face animation engine
│   ├── models/                 # ONNX TTS model directory
│   ├── routers/                # FastAPI endpoints
│   ├── services/
│   │   ├── avatar_service.py   # Video generation & SadTalker pipeline
│   │   ├── tts_service.py      # Edge-TTS & Kokoro neural speech service
│   │   └── project_service.py  # Projects and history management
│   ├── uploads/                # Local avatar uploads and generated MP4s
│   ├── main.py                 # FastAPI server entrypoint
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main Studio interface & player
│   │   ├── App.css             # Modern dark/light styling
│   │   └── main.jsx            # React root
│   ├── package.json            # Node.js dependencies
│   └── vite.config.js          # Vite config
└── README.md                   # Full documentation & setup guide
```

---

## 🔧 Troubleshooting on macOS

- **Permission Denied when running `.sh` scripts?**
  Run:
  ```bash
  chmod +x *.sh
  ```
- **"ffmpeg: command not found"?**
  Run:
  ```bash
  brew install ffmpeg
  ```
- **Port 8000 or 5173 already in use?**
  Check and stop previous processes:
  ```bash
  lsof -i :8000 | awk 'NR>1 {print $2}' | xargs kill -9
  lsof -i :5173 | awk 'NR>1 {print $2}' | xargs kill -9
  ```
- **Apple Silicon (M1/M2/M3/M4) Acceleration**:
  PyTorch automatically utilizes CPU / MPS on macOS. The SadTalker and TTS engines are configured to run natively without requiring external cloud keys.

---

## 📄 License
MIT License. Built for local AI experimentation and media creation.
