#!/bin/bash

echo "Starting X-Engage AI Assistant..."
echo ""

# Function to cleanup processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM

# Start the backend
echo "Starting backend server..."
cd backend
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Virtual environment not found, please run setup first"
    exit 1
fi
uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 3

# Start the frontend
echo "Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "X-Engage AI Assistant is starting up!"
echo "Backend will be available at: http://localhost:8000"
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user to press Ctrl+C
wait $BACKEND_PID $FRONTEND_PID