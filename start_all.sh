#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"

trap 'kill $(jobs -p)' EXIT

echo "=========================================="
echo "🚀 Starting AvatarAI (Talking Avatar Studio)"
echo "   macOS (Apple Silicon / Intel) & Linux"
echo "=========================================="

# Activate virtual environment if present
if [ -f "$DIR/backend/venv/bin/activate" ]; then
    source "$DIR/backend/venv/bin/activate"
    export PATH="$DIR/backend/venv/bin:$PATH"
fi

# Ensure models are downloaded
if [ ! -f "$DIR/backend/models/kokoro-v1.0.onnx" ] || [ ! -f "$DIR/backend/engines/SadTalker/checkpoints/SadTalker_V0.0.2_256.safetensors" ]; then
    echo "🧠 Models not found. Running automated downloader..."
    python3 "$DIR/backend/download_models.py"
fi

echo "🚀 Starting Backend on http://127.0.0.1:8000 ..."
cd "$DIR/backend"
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

echo "✨ Starting Frontend on http://localhost:5173 ..."
cd "$DIR/frontend"
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies (npm install)..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!

echo ""
echo "=========================================="
echo "🌟 AvatarAI Studio is running!"
echo "👉 Open http://localhost:5173 in your browser"
echo "👉 API Docs: http://127.0.0.1:8000/docs"
echo "Press Ctrl+C to stop both servers."
echo "=========================================="

wait
