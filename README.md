# X-Engage AI Assistant

A web-based AI assistant designed to enhance user engagement on X (formerly Twitter) through intelligent automation and personalized content generation — without relying on the official Twitter API.

## Core Features

### AI-Generated Replies
- Generate thoughtful, on-brand replies to tweets using GPT-4
- Context-aware responses that match the user's desired tone

### Tone Customization & Adjustment
- Choose from predefined tones: professional, witty, sarcastic, motivational
- Create custom tone presets
- AI adapts language for both replies and posts

### Manual & AI-Assisted Posting
- Manual posting: Write and publish directly from the dashboard
- AI-assisted posting: Describe what you want to say, and get AI-generated suggestions

### Content Analysis
- Basic analytics on tweet performance and tone alignment
- Engagement indicators: likes, reposts, comments (via scraping)
- Content sentiment and style breakdown

### Unified Web Interface
- Clean, intuitive dashboard
- Compose and schedule posts
- View AI suggestions
- Analyze engagement
- Customize tone settings

## Technical Stack

- **AI Integration**: OpenAI's GPT-4 for content generation
- **Twitter Interaction**: Secure browser automation via Playwright (no Twitter API)
- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Hosting**: Vercel (frontend), Render or Railway (backend)

## Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.9+)
- npm or yarn

### Troubleshooting

#### Missing pydantic-settings Module
If you encounter an error about a missing `pydantic_settings` module when starting the backend, you need to install the `pydantic-settings` package:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install pydantic-settings
```

This package is now included in the requirements.txt file, so running the setup script again will also resolve this issue.

### Installation

#### Option 1: Using Setup Scripts (Recommended)

**Windows:**
```
setup-app.bat
```

**Unix/Linux/Mac:**
```bash
# Make the script executable
chmod +x setup-app.sh
# Run the setup script
./setup-app.sh
```

#### Option 2: Manual Setup

**Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend Setup:**
```bash
cd frontend
npm install  # or: yarn install
```

### Running the Application

#### Option 1: Using Run Scripts (Recommended)

**Windows:**
```
run-app.bat
```

**Unix/Linux/Mac:**
```bash
# Make the script executable
chmod +x run-app.sh
# Run the application
./run-app.sh
```

#### Option 2: Manual Startup

**Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm start  # or: yarn start
```

## Project Structure
```
.
├── .gitignore              # Git ignore file for excluding build artifacts and dependencies
├── frontend/               # React + Tailwind CSS frontend
│   ├── public/             # Static files
│   └── src/                # React source code
│       ├── components/     # UI components
│       ├── contexts/       # React contexts
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       └── services/       # API services
│
└── backend/                # FastAPI backend
    ├── app/                # Application code
    │   ├── api/            # API endpoints
    │   ├── core/           # Core functionality
    │   ├── models/         # Data models
    │   └── services/       # Business logic
    └── tests/              # Unit tests
```
