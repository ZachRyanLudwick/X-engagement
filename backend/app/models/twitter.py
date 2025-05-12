from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime

class TwitterCredentials(BaseModel):
    """Credentials for Twitter authentication."""
    username: str = Field(..., description="Twitter username")
    password: str = Field(..., description="Twitter password")
    # In a real app, you'd use more secure methods for handling credentials
    two_factor_token: Optional[str] = Field(None, description="Two-factor authentication token")
    session_token: Optional[str] = Field(None, description="Session token for persistent login")

class TwitterAuthRequest(BaseModel):
    """Model for Twitter authentication request."""
    request_id: str = Field(..., description="Authentication request ID")
    status: str = Field(..., description="Status of the authentication request")
    error: Optional[str] = Field(None, description="Error message if authentication failed")

class TwitterAuthResponse(BaseModel):
    """Response for Twitter authentication."""
    success: bool = Field(..., description="Whether the authentication was successful")
    request_id: str = Field(..., description="Authentication request ID")
    status: str = Field(..., description="Status of the authentication request")
    error: Optional[str] = Field(None, description="Error message if authentication failed")
    username: Optional[str] = Field(None, description="Twitter username if authentication was successful")
    display_name: Optional[str] = Field(None, description="Twitter display name if authentication was successful")
    profile_image_url: Optional[str] = Field(None, description="Twitter profile image URL if authentication was successful")

class Media(BaseModel):
    """Model representing media in a tweet."""
    media_id: str = Field(..., description="Media ID")
    media_type: Literal["image", "gif", "video"] = Field(..., description="Type of media")
    url: str = Field(..., description="URL to the media")
    alt_text: Optional[str] = Field(None, description="Alternative text for the media")

class Tweet(BaseModel):
    """Model representing a tweet."""
    id: str = Field(..., description="Tweet ID")
    text: str = Field(..., description="Tweet text content")
    author: str = Field(..., description="Username of tweet author")
    created_at: datetime = Field(..., description="Tweet creation timestamp")
    likes_count: int = Field(0, description="Number of likes")
    retweets_count: int = Field(0, description="Number of retweets")
    replies_count: int = Field(0, description="Number of replies")
    media: Optional[List[Media]] = Field(None, description="Media in the tweet")
    hashtags: Optional[List[str]] = Field(None, description="Hashtags in the tweet")
    mentions: Optional[List[str]] = Field(None, description="Mentions in the tweet")
    urls: Optional[List[str]] = Field(None, description="URLs in the tweet")
    is_reply: bool = Field(False, description="Whether this tweet is a reply")
    reply_to: Optional[str] = Field(None, description="ID of the tweet this is a reply to")
    is_thread: bool = Field(False, description="Whether this tweet is part of a thread")
    thread_id: Optional[str] = Field(None, description="ID of the thread this tweet belongs to")
    position_in_thread: Optional[int] = Field(None, description="Position in the thread (0-indexed)")
    
class TweetThread(BaseModel):
    """Model representing a thread of tweets."""
    thread_id: str = Field(..., description="Thread ID")
    author: str = Field(..., description="Username of thread author")
    created_at: datetime = Field(..., description="Thread creation timestamp")
    tweets: List[Tweet] = Field(..., description="Tweets in the thread")
    total_engagement: Optional[Dict[str, int]] = Field(None, description="Total engagement metrics for the thread")

class TweetAnalytics(BaseModel):
    """Analytics for a tweet."""
    engagement_rate: float = Field(..., description="Engagement rate percentage")
    sentiment_score: float = Field(..., description="Sentiment score (-1.0 to 1.0)")
    tone_analysis: Dict[str, float] = Field(..., description="Tone breakdown by percentage")
    impressions: Optional[int] = Field(None, description="Number of impressions")
    profile_clicks: Optional[int] = Field(None, description="Number of profile clicks")
    url_clicks: Optional[Dict[str, int]] = Field(None, description="Number of clicks per URL")
    hashtag_clicks: Optional[Dict[str, int]] = Field(None, description="Number of clicks per hashtag")
    detail_expands: Optional[int] = Field(None, description="Number of detail expands")
    engagement_breakdown: Optional[Dict[str, float]] = Field(None, description="Breakdown of engagement by type")
    audience_demographics: Optional[Dict[str, Any]] = Field(None, description="Demographics of the audience that engaged")
    best_performing_time: Optional[str] = Field(None, description="Best performing time for this type of content")

class PostTweetRequest(BaseModel):
    """Request to post a tweet."""
    content: str = Field(..., description="Tweet content to post")
    credentials: TwitterCredentials = Field(..., description="Twitter credentials")
    media_paths: Optional[List[str]] = Field(None, description="Paths to media files to attach")
    reply_to_id: Optional[str] = Field(None, description="ID of the tweet to reply to")
    thread_id: Optional[str] = Field(None, description="ID of the thread this tweet belongs to")
    schedule_time: Optional[datetime] = Field(None, description="Time to schedule the tweet for")
    
class TweetResponse(BaseModel):
    """Response after posting a tweet."""
    success: bool = Field(..., description="Whether the tweet was posted successfully")
    tweet_id: Optional[str] = Field(None, description="ID of the posted tweet if successful")
    tweet_url: Optional[str] = Field(None, description="URL of the posted tweet if successful")
    error: Optional[str] = Field(None, description="Error message if posting failed")
    scheduled: Optional[bool] = Field(False, description="Whether the tweet was scheduled")
    schedule_time: Optional[datetime] = Field(None, description="Time the tweet is scheduled for")

class PostThreadRequest(BaseModel):
    """Request to post a thread."""
    tweets: List[str] = Field(..., description="List of tweet contents in the thread")
    credentials: TwitterCredentials = Field(..., description="Twitter credentials")
    media_paths: Optional[Dict[int, List[str]]] = Field(None, description="Paths to media files to attach to each tweet")
    schedule_time: Optional[datetime] = Field(None, description="Time to schedule the thread for")
    
class ThreadResponse(BaseModel):
    """Response after posting a thread."""
    success: bool = Field(..., description="Whether the thread was posted successfully")
    thread_id: Optional[str] = Field(None, description="ID of the thread if successful")
    tweet_ids: Optional[List[str]] = Field(None, description="IDs of the posted tweets if successful")
    first_tweet_url: Optional[str] = Field(None, description="URL of the first tweet in the thread if successful")
    error: Optional[str] = Field(None, description="Error message if posting failed")
    scheduled: Optional[bool] = Field(False, description="Whether the thread was scheduled")
    schedule_time: Optional[datetime] = Field(None, description="Time the thread is scheduled for")

class ScheduledTweet(BaseModel):
    """Model representing a scheduled tweet."""
    id: str = Field(..., description="Scheduled tweet ID")
    content: str = Field(..., description="Tweet content")
    schedule_time: datetime = Field(..., description="Time the tweet is scheduled for")
    credentials: TwitterCredentials = Field(..., description="Twitter credentials")
    media_paths: Optional[List[str]] = Field(None, description="Paths to media files to attach")
    reply_to_id: Optional[str] = Field(None, description="ID of the tweet to reply to")
    thread_id: Optional[str] = Field(None, description="ID of the thread this tweet belongs to")
    position_in_thread: Optional[int] = Field(None, description="Position in the thread (0-indexed)")
    status: Literal["pending", "posted", "failed"] = Field("pending", description="Status of the scheduled tweet")
    result: Optional[TweetResponse] = Field(None, description="Result of posting the tweet")

class ScheduledThread(BaseModel):
    """Model representing a scheduled thread."""
    id: str = Field(..., description="Scheduled thread ID")
    tweets: List[str] = Field(..., description="List of tweet contents in the thread")
    schedule_time: datetime = Field(..., description="Time the thread is scheduled for")
    credentials: TwitterCredentials = Field(..., description="Twitter credentials")
    media_paths: Optional[Dict[int, List[str]]] = Field(None, description="Paths to media files to attach to each tweet")
    status: Literal["pending", "posted", "failed"] = Field("pending", description="Status of the scheduled thread")
    result: Optional[ThreadResponse] = Field(None, description="Result of posting the thread")

class MemeTemplate(BaseModel):
    """Model representing a meme template."""
    id: str = Field(..., description="Template ID")
    name: str = Field(..., description="Template name")
    url: str = Field(..., description="URL to the template image")
    text_fields: int = Field(..., description="Number of text fields in the template")
    example_texts: Optional[List[str]] = Field(None, description="Example texts for the template")
    tags: Optional[List[str]] = Field(None, description="Tags for the template")

class MemeGenerationRequest(BaseModel):
    """Request to generate a meme."""
    template_id: str = Field(..., description="ID of the template to use")
    texts: List[str] = Field(..., description="Texts to add to the template")
    tweet_context: Optional[str] = Field(None, description="Context from a tweet to reference")

class MemeGenerationResponse(BaseModel):
    """Response after generating a meme."""
    success: bool = Field(..., description="Whether the meme was generated successfully")
    meme_url: Optional[str] = Field(None, description="URL to the generated meme if successful")
    error: Optional[str] = Field(None, description="Error message if generation failed")

class ContentRepurposeRequest(BaseModel):
    """Request to repurpose content."""
    source_url: str = Field(..., description="URL to the source content (YouTube, blog, etc.)")
    content_type: Literal["video", "audio", "blog", "article"] = Field(..., description="Type of source content")
    output_format: Literal["tweet", "thread"] = Field(..., description="Desired output format")
    tone: Optional[str] = Field(None, description="Desired tone for the output")
    max_length: Optional[int] = Field(None, description="Maximum length of the output")
    include_link: bool = Field(True, description="Whether to include a link to the source")

class ContentRepurposeResponse(BaseModel):
    """Response after repurposing content."""
    success: bool = Field(..., description="Whether the content was repurposed successfully")
    content: Optional[str] = Field(None, description="Repurposed content if output_format is 'tweet'")
    thread: Optional[List[str]] = Field(None, description="Repurposed content if output_format is 'thread'")
    error: Optional[str] = Field(None, description="Error message if repurposing failed")