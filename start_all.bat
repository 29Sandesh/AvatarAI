@echo off
echo ==========================================
echo    Starting AvatarAI (Frontend + Backend)
echo ==========================================

echo Starting Backend Server on http://127.0.0.1:8000 ...
start "AvatarAI Backend" cmd /k "set PYTHONIOENCODING=utf-8 && cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo Starting Frontend Server on http://localhost:5173 ...
start "AvatarAI Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers are starting up!
echo Visit: http://localhost:5173
echo.
pause
