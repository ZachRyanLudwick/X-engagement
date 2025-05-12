@echo off
echo Setting up X-Engage AI Assistant...
echo.

REM Setup backend
echo Setting up backend...
cd backend
python -m venv venv
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

REM Setup frontend
echo.
echo Setting up frontend...
cd frontend
npm install
cd ..

echo.
echo Setup complete! You can now run the application using run-app.bat
echo.