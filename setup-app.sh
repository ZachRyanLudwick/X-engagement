#!/bin/bash

echo "Setting up X-Engage AI Assistant..."
echo ""

# Setup backend
echo "Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Setup frontend
echo ""
echo "Setting up frontend..."
cd frontend
npm install
cd ..

echo ""
echo "Setup complete! You can now run the application using:"
echo "bash run-app.sh"
echo ""
echo "Note: You may need to make the script executable first:"
echo "chmod +x run-app.sh"
echo ""