#!/bin/bash
cd "$(dirname "$0")/backend"
source venv/bin/activate
export PATH="$(pwd)/venv/bin:$PATH"
echo "🚀 Starting AvatarAI Backend on http://127.0.0.1:8000 ..."
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
