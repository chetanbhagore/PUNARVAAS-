@echo off
echo ===================================================
echo   PUNARVAAS - Building Backend & Frontend
echo ===================================================

echo [1/3] Setting up Python virtual environment and seeding DB...
cd /d %~dp0backend
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\activate
pip install -r requirements.txt
python seed.py
python test_backend.py

echo.
echo [2/3] Building Frontend Production Bundle...
cd /d %~dp0frontend
call npm install
call npm run build

echo.
echo ===================================================
echo   BUILD COMPLETE!
echo   Run start.bat to launch the application.
echo ===================================================
pause
