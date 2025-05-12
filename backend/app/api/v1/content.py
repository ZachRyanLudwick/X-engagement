from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app.services.ai_service import AIService
from app.models.content import (
    ContentRequest, ContentResponse, ToneSettings,
    ThreadRequest, ThreadResponse, ThreadTweet,
    ToneAnalysisRequest, ToneAnalysisResponse,
    PerformancePredictionRequest, PerformancePredictionResponse
)

router = APIRouter()
ai_service = AIService()

class GenerateReplyRequest(BaseModel):
    tweet_text: str
    tweet_context: Optional[str] = None
    tone: ToneSettings
    is_preview: Optional[bool] = False
    tweet_metadata: Optional[Dict[str, Any]] = None
    max_length: Optional[int] = 280

class GeneratePostRequest(BaseModel):
    description: str
    tone: ToneSettings
    max_length: Optional[int] = 280
    is_preview: Optional[bool] = False

class GenerateThreadRequest(BaseModel):
    main_topic: str
    num_tweets: int = 3
    tone: ToneSettings
    keywords: Optional[List[str]] = None
    max_length_per_tweet: Optional[int] = 280

class EditThreadRequest(BaseModel):
    thread: List[str]
    position: int
    new_text: str
    tone: ToneSettings

class ToneMatchRequest(BaseModel):
    text: str
    target_tone: str

@router.post("/generate-reply", response_model=ContentResponse)
async def generate_reply(request: GenerateReplyRequest):
    """Generate an AI reply to a tweet with the specified tone."""
    try:
        content_request = ContentRequest(
            content_type="reply",
            source_text=request.tweet_text,
            context=request.tweet_context,
            tone=request.tone,
            is_preview=request.is_preview,
            tweet_metadata=request.tweet_metadata,
            max_length=request.max_length
        )
        return await ai_service.generate_content(content_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate reply: {str(e)}")

@router.post("/generate-post", response_model=ContentResponse)
async def generate_post(request: GeneratePostRequest):
    """Generate an AI post based on a description with the specified tone."""
    try:
        content_request = ContentRequest(
            content_type="post",
            source_text=request.description,
            tone=request.tone,
            max_length=request.max_length,
            is_preview=request.is_preview
        )
        return await ai_service.generate_content(content_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate post: {str(e)}")

@router.post("/generate-thread", response_model=ThreadResponse)
async def generate_thread(request: GenerateThreadRequest):
    """Generate an AI thread based on a main topic with the specified tone."""
    try:
        thread_request = ThreadRequest(
            main_topic=request.main_topic,
            num_tweets=request.num_tweets,
            tone=request.tone,
            keywords=request.keywords,
            max_length_per_tweet=request.max_length_per_tweet
        )
        return await ai_service.generate_thread(thread_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate thread: {str(e)}")

@router.post("/edit-thread", response_model=ThreadResponse)
async def edit_thread(request: EditThreadRequest):
    """Edit a specific tweet in a thread and regenerate coherence."""
    try:
        # Create a thread from the existing tweets
        tweets = [ThreadTweet(position=i, text=text) for i, text in enumerate(request.thread)]
        
        # Replace the specified tweet
        tweets[request.position].text = request.new_text
        
        # Return the modified thread
        return ThreadResponse(
            tweets=tweets,
            main_topic="Edited thread",
            tone_used=request.tone
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to edit thread: {str(e)}")

@router.post("/analyze-tone", response_model=Dict[str, Any])
async def analyze_tone(text: str):
    """Analyze the tone of a given text."""
    try:
        return await ai_service.analyze_tone(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze tone: {str(e)}")

@router.post("/match-tone", response_model=ToneSettings)
async def match_tone(request: ToneMatchRequest):
    """Match the tone of a given text to a target tone."""
    try:
        return await ai_service.match_tone(request.text, request.target_tone)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to match tone: {str(e)}")

@router.post("/predict-performance", response_model=PerformancePredictionResponse)
async def predict_performance(request: PerformancePredictionRequest):
    """Predict the performance of content."""
    try:
        return await ai_service.predict_performance(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to predict performance: {str(e)}")