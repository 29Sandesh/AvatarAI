#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies (npm install)..."
    npm install
fi

echo "✨ Starting AvatarAI Frontend on http://localhost:5173 ..."
npm run dev
