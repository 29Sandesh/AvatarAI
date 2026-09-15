#!/bin/bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

echo "=========================================================="
echo "🍎 AvatarAI — Automated Setup for macOS (MacBook Pro/Air)"
echo "   Supports Apple Silicon (M1/M2/M3/M4) & Intel Macs"
echo "=========================================================="

# 1. Check Homebrew
if ! command -v brew &> /dev/null; then
    echo "⚠️  Homebrew is not detected."
    echo "   To install Homebrew, run:"
    echo '   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
fi

# 2. Check and prompt for FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "📦 FFmpeg is required for audio/video processing. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install ffmpeg
    else
        echo "❌ Please install FFmpeg manually: brew install ffmpeg"
        exit 1
    fi
else
    echo "✅ FFmpeg is installed."
fi

# 3. Check Node.js & npm
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "📦 Node.js is required for the frontend. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install node
    else
        echo "❌ Please install Node.js: brew install node"
        exit 1
    fi
else
    echo "✅ Node.js $(node -v) is installed."
fi

# 4. Check Python 3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required. Install via: brew install python@3.11"
    exit 1
else
    echo "✅ Python 3 ($(python3 --version)) is installed."
fi

# 5. Create Python Virtual Environment
echo ""
echo "🐍 Setting up Python virtual environment (backend/venv)..."
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi

source backend/venv/bin/activate
pip install --upgrade pip

echo "📦 Installing Python dependencies..."
pip install -r backend/requirements.txt

# 6. Install Frontend Dependencies
echo ""
echo "💻 Installing Frontend dependencies (npm install)..."
cd "$DIR/frontend"
npm install
cd "$DIR"

# 7. Download AI Models and Checkpoints
echo ""
echo "🧠 Downloading AI models and checkpoints..."
python3 backend/download_models.py

# 8. Set execute permissions on launcher scripts
chmod +x *.sh

echo ""
echo "=========================================================="
echo "🎉 Setup Complete! You're ready to launch AvatarAI."
echo ""
echo "To start both backend and frontend together:"
echo "   ./start_all.sh"
echo ""
echo "Or start them in separate terminal tabs:"
echo "   ./run_backend.sh"
echo "   ./run_frontend.sh"
echo "=========================================================="
