@echo off
title AutoTailor AI - Internship and Resume Agent
color 0A

echo ====================================================================
echo   AutoTailor AI - Internship and Application Agent
echo ====================================================================
echo.

cd /d "C:\Users\shami\OneDrive\Desktop\Coding\Full-Stack Projects\Internship-AI-Agent"

echo [*] Opening dashboard at http://localhost:8500
start http://localhost:8500

echo [*] Starting Agent Engine on port 8500...
echo.
python -m uvicorn backend.app:app --host 127.0.0.1 --port 8500 --reload
pause
