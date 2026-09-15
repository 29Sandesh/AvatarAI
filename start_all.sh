#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"

trap 'kill $(jobs -p)' EXIT

echo "=========================================="
echo "🚀 Starting AvatarAI (AvatarCopy Project)"
echo "   Apple Silicon M4 Local AI Pipeline"
echo "=========================================="

echo "Starting Backend on http://127.0.0.1:8000 ..."
cd "$DIR/backend"
source venv/bin/activate
export PATH="$(pwd)/venv/bin:$PATH"
uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

sleep 2

echo "Starting Frontend on http://localhost:5173 ..."
cd "$DIR/frontend"
npm run dev &
FRONTEND_PID=$!

echo "Both servers are live! Open http://localhost:5173 in your browser."
echo "Press Ctrl+C to stop both servers."

wait
