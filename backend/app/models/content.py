from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict

class ToneSettings(BaseModel):
    """Settings for the tone of generated content."""
    tone_name: str = Field(..., description="Name of the tone (e.g., professional, witty)")
    tone_strength: float = Field(0.7, ge=0.0, le=1.0, description="Strength of the tone (0.0 to 1.0)")
    custom_instructions: Optional[str] = Field(None, description="Custom instructions for tone adjustment")

class ContentRequest(BaseModel):
    """Request for generating content."""
    content_type: Literal["post", "reply"] = Field(..., description="Type of content to generate")
    source_text: str = Field(..., description="Source text (tweet to reply to or description for post)")
    context: Optional[str] = Field(None, description="Additional context for generation")
    tone: ToneSettings = Field(..., description="Tone settings for generation")
    max_length: Optional[int] = Field(280, description="Maximum length of generated content")
    is_preview: Optional[bool] = Field(False, description="Whether this is a preview request")
    tweet_metadata: Optional[Dict] = Field(None, description="Additional metadata about the tweet (hashtags, mentions, etc.)")

class ContentVariant(BaseModel):
    """A variant of generated content."""
    text: str = Field(..., description="Generated text content")
    score: float = Field(..., description="Quality score for this variant")
    performance_prediction: Optional[Dict] = Field(None, description="Predicted performance metrics")

class ContentResponse(BaseModel):
    """Response with generated content."""
    variants: List[ContentVariant] = Field(..., description="List of content variants")
    source_text: str = Field(..., description="Original source text")
    tone_used: ToneSettings = Field(..., description="Tone settings used for generation")
    
class ThreadRequest(BaseModel):
    """Request for generating a thread."""
    main_topic: str = Field(..., description="Main topic or idea for the thread")
    num_tweets: int = Field(3, ge=2, le=10, description="Number of tweets in the thread")
    tone: ToneSettings = Field(..., description="Tone settings for generation")
    keywords: Optional[List[str]] = Field(None, description="Keywords to include in the thread")
    max_length_per_tweet: Optional[int] = Field(280, description="Maximum length per tweet")
    
class ThreadTweet(BaseModel):
    """A single tweet in a thread."""
    position: int = Field(..., description="Position in the thread (0-indexed)")
    text: str = Field(..., description="Tweet text content")
    
class ThreadResponse(BaseModel):
    """Response with generated thread."""
    tweets: List[ThreadTweet] = Field(..., description="List of tweets in the thread")
    main_topic: str = Field(..., description="Original main topic")
    tone_used: ToneSettings = Field(..., description="Tone settings used for generation")

class ToneAnalysisRequest(BaseModel):
    """Request for analyzing the tone of text."""
    text: str = Field(..., description="Text to analyze")
    
class ToneAnalysisResponse(BaseModel):
    """Response with tone analysis."""
    analysis: str = Field(..., description="Textual analysis of the tone")
    tone_breakdown: Dict[str, float] = Field(..., description="Breakdown of tone by percentage")
    
class PerformancePredictionRequest(BaseModel):
    """Request for predicting performance of content."""
    text: str = Field(..., description="Text to predict performance for")
    content_type: Literal["post", "reply", "thread"] = Field(..., description="Type of content")
    
class PerformancePredictionResponse(BaseModel):
    """Response with performance prediction."""
    engagement_prediction: Dict[str, float] = Field(..., description="Predicted engagement metrics")
    improvement_suggestions: List[str] = Field(..., description="Suggestions for improving performance")