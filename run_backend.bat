@echo off
set PYTHONIOENCODING=utf-8
cd /d "%~dp0backend"
echo [AvatarCopy] Starting FastAPI Backend on http://127.0.0.1:8000 ...
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
