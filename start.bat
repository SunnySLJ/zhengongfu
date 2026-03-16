@echo off
chcp 65001 >nul
echo ==================================
echo   AutoPipeline Starting...
echo ==================================

echo [1/2] Starting API server...
cd /d "%~dp0trend-fetcher-skill"
set PYTHONIOENCODING=utf-8
start "API-Server" python server.py

timeout /t 2 /nobreak >nul

echo [2/2] Starting SaaS app...
cd /d "%~dp0frontend\saas-app"
start "SaaS-App" npm run dev

echo.
echo ==================================
echo   Started
echo   Frontend: http://localhost:8888
echo   API:      http://localhost:8899
echo ==================================
pause
