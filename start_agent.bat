@echo off
title Internship AI Agent - Autonomous Radar & Auto-Applier
color 0A
cls
echo ========================================================
echo       INTERNSHIP AI AGENT & RADAR (Port 8500)
echo ========================================================
echo.
echo Starting FastAPI & Playwright Autonomous Engine...
echo.
start http://localhost:8500
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8500 --reload
pause
