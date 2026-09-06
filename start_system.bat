@echo off
title PortfolioIQ AI — Unified System Launcher
color 0b

:: 1. Check Python Virtual Environment
if not exist "backend\venv\Scripts\python.exe" (
    echo [ERROR] Backend virtualenv not found at backend\venv!
    echo Please ensure Python environment is set up.
    pause
    exit /b 1
)

:: 2. Check Node Modules
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend node_modules not found!
    echo Please run 'npm install' inside frontend directory first.
    pause
    exit /b 1
)

echo [1/3] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "PortfolioIQ AI — Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"

echo [2/3] Starting Angular Frontend on http://localhost:4200 ...
start "PortfolioIQ AI — Frontend (Angular)" cmd /k "cd /d %~dp0frontend && npm start"

echo [3/3] Waiting 6 seconds for servers to initialize...
timeout /t 6 /nobreak > nul

echo Opening browser at http://localhost:4200 ...
start http://localhost:4200

echo.
echo =====================================================================
echo  [SUCCESS] All PortfolioIQ AI subsystems are booting up!
echo   - Backend API Docs:   http://127.0.0.1:8000/docs
echo   - Web Application:    http://localhost:4200
echo   - System Diagnostics: http://127.0.0.1:8000/api/system/status
echo.
echo  Keep both backend and frontend terminal windows open during demo.
echo =====================================================================
echo.
pause

