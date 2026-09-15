#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/backend"

if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi

if [ ! -f "models/kokoro-v1.0.onnx" ] || [ ! -f "engines/SadTalker/checkpoints/SadTalker_V0.0.2_256.safetensors" ]; then
    echo "🧠 Models not found. Running automated downloader..."
    python3 download_models.py
fi

echo "🚀 Starting AvatarAI Backend on http://127.0.0.1:8000 ..."
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
