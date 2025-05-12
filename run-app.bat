@echo off
echo Starting X-Engage AI Assistant...
echo.

REM Start the backend
echo Starting backend server...
start cmd /k "cd backend && if exist venv\Scripts\activate.bat (call venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000) else (echo Virtual environment not found, please run setup first)"

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak > nul

REM Start the frontend
echo Starting frontend server...
start cmd /k "cd frontend && npm start"

echo.
echo X-Engage AI Assistant is starting up!
echo Backend will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to stop all services...
pause > nul

REM Kill all node and Python processes (be careful with this in a real environment)
taskkill /f /im node.exe > nul 2>&1
taskkill /f /im python.exe > nul 2>&1

echo All services stopped.