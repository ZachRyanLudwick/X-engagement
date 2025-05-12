from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.api.routes import router as api_router
from app.core.database import MongoDB

app = FastAPI(
    title="X-Engage AI Assistant API",
    description="API for enhancing user engagement on X (Twitter) through AI-powered content generation",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Welcome to X-Engage AI Assistant API",
        "docs_url": "/docs",
    }

@app.on_event("startup")
async def startup_db_client():
    await MongoDB.connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_db_client():
    await MongoDB.close_mongo_connection()

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)