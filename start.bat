@echo off
echo ===================================================
echo   PUNARVAAS - Starting Backend and Frontend Servers
echo ===================================================

echo [1/2] Launching Backend FastAPI Server (Port 8000)...
start "PUNARVAAS Backend" cmd /k "cd /d %~dp0backend && .venv\Scripts\activate && uvicorn main:app --reload --port 8000"

echo [2/2] Launching Frontend Vite Dev Server (Port 5173)...
start "PUNARVAAS Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ===================================================
echo   Servers are starting!
echo   Frontend Dashboard: http://localhost:5173
echo   Backend API:        http://localhost:8000
echo   Swagger API Docs:   http://localhost:8000/docs
echo ===================================================
timeout /t 5
start http://localhost:5173
