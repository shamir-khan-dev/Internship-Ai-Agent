@echo off
title AutoTailor AI - Autonomous Internship Radar & Application Copilot
color 0A

echo ====================================================================
echo   AutoTailor AI - Autonomous Internship Radar & Application Agent
echo ====================================================================
echo.

:: Navigate to script directory
cd /d "%~dp0"

echo [*] Launching dashboard at http://localhost:8500 ...
start http://localhost:8500

echo [*] Starting FastAPI Backend on port 8500...
echo.
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8500 --reload
pause
