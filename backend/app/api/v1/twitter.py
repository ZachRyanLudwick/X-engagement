from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import uuid

from app.services.twitter_service import TwitterService
from app.models.twitter import (
    Tweet, TweetResponse, PostTweetRequest, TweetAnalytics,
    PostThreadRequest, ThreadResponse, ScheduledTweet, ScheduledThread,
    MemeGenerationRequest, MemeGenerationResponse,
    ContentRepurposeRequest, ContentRepurposeResponse, TwitterCredentials
)
from app.models.user import UserProfile, AccountSettings
from app.api.v1.user import get_current_user
from app.services.user_service import get_user_twitter_account

router = APIRouter()
twitter_service = TwitterService()

# In-memory storage for scheduled tweets and threads (in a real app, use a database)
scheduled_tweets = {}
scheduled_threads = {}

@router.post("/post", response_model=TweetResponse)
async def post_tweet(
    request: PostTweetRequest, 
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user)
):
    """Post a tweet to X (Twitter) using browser automation."""
    try:
        # If no credentials provided, use the default account from user settings
        if not request.credentials and current_user.settings.default_account:
            account = await get_user_twitter_account(current_user.user_id, current_user.settings.default_account)
            if account and account.session_data:
                # Create credentials from account
                request.credentials = TwitterCredentials(
                    username=account.username,
                    password="",  # Not needed when using session data
                    session_token=account.username,  # Use username as token identifier
                )
                
                # If no credentials and no default account, raise error
                if not request.credentials:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="No Twitter credentials provided and no default account set"
                    )
        
        # If scheduled for later, store it and return
        if request.schedule_time and request.schedule_time > datetime.now():
            tweet_id = f"scheduled-{uuid.uuid4()}"
            scheduled_tweet = ScheduledTweet(
                id=tweet_id,
                content=request.content,
                schedule_time=request.schedule_time,
                credentials=request.credentials,
                media_paths=request.media_paths,
                reply_to_id=request.reply_to_id,
                thread_id=request.thread_id,
                status="pending"
            )
            scheduled_tweets[tweet_id] = scheduled_tweet
            return TweetResponse(
                success=True,
                scheduled=True,
                schedule_time=request.schedule_time,
                tweet_id=tweet_id
            )
        
        # Otherwise post immediately
        result = await twitter_service.post_tweet(
            request.content, 
            request.credentials, 
            request.media_paths,
            reply_to_id=request.reply_to_id,
            thread_id=request.thread_id,
            user_id=current_user.user_id if current_user else None
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post tweet: {str(e)}")

@router.post("/post-thread", response_model=ThreadResponse)
async def post_thread(
    request: PostThreadRequest, 
    background_tasks: BackgroundTasks,
    current_user: UserProfile = Depends(get_current_user)
):
    """Post a thread of tweets to X (Twitter) using browser automation."""
    try:
        # If no credentials provided, use the default account from user settings
        if not request.credentials and current_user.settings.default_account:
            account = await get_user_twitter_account(current_user.user_id, current_user.settings.default_account)
            if account and account.session_data:
                # Create credentials from account
                request.credentials = TwitterCredentials(
                    username=account.username,
                    password="",  # Not needed when using session data
                    session_token=account.username,  # Use username as token identifier
                )
                
        # If no credentials and no default account, raise error
        if not request.credentials:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Twitter credentials provided and no default account set"
            )
        
        # If scheduled for later, store it and return
        if request.schedule_time and request.schedule_time > datetime.now():
            thread_id = f"scheduled-thread-{uuid.uuid4()}"
            scheduled_thread = ScheduledThread(
                id=thread_id,
                tweets=request.tweets,
                schedule_time=request.schedule_time,
                credentials=request.credentials,
                media_paths=request.media_paths,
                status="pending"
            )
            scheduled_threads[thread_id] = scheduled_thread
            return ThreadResponse(
                success=True,
                scheduled=True,
                schedule_time=request.schedule_time,
                thread_id=thread_id
            )
        
        # Otherwise post immediately
        result = await twitter_service.post_thread(
            request.tweets, 
            request.credentials, 
            request.media_paths,
            user_id=current_user.user_id if current_user else None
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to post thread: {str(e)}")

@router.get("/fetch-timeline", response_model=List[Tweet])
async def fetch_timeline(username: str, count: Optional[int] = 20):
    """Fetch recent tweets from a user's timeline."""
    try:
        tweets = await twitter_service.fetch_timeline(username, count)
        return tweets
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch timeline: {str(e)}")

@router.get("/fetch-tweet/{tweet_id}", response_model=Tweet)
async def fetch_tweet(tweet_id: str):
    """Fetch a specific tweet by ID."""
    try:
        tweet = await twitter_service.fetch_tweet(tweet_id)
        return tweet
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tweet: {str(e)}")

@router.post("/reply/{tweet_id}", response_model=TweetResponse)
async def reply_to_tweet(
    tweet_id: str, 
    request: PostTweetRequest,
    current_user: UserProfile = Depends(get_current_user)
):
    """Reply to a specific tweet."""
    try:
        # If no credentials provided, use the default account from user settings
        if not request.credentials and current_user.settings.default_account:
            account = await get_user_twitter_account(current_user.user_id, current_user.settings.default_account)
            if account and account.session_data:
                # Create credentials from account
                request.credentials = TwitterCredentials(
                    username=account.username,
                    password="",  # Not needed when using session data
                    session_token=account.username,  # Use username as token identifier
                )
                
        # If no credentials and no default account, raise error
        if not request.credentials:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Twitter credentials provided and no default account set"
            )
        
        # If scheduled for later, store it and return
        if request.schedule_time and request.schedule_time > datetime.now():
            reply_id = f"scheduled-reply-{uuid.uuid4()}"
            scheduled_tweet = ScheduledTweet(
                id=reply_id,
                content=request.content,
                schedule_time=request.schedule_time,
                credentials=request.credentials,
                media_paths=request.media_paths,
                reply_to_id=tweet_id,
                status="pending"
            )
            scheduled_tweets[reply_id] = scheduled_tweet
            return TweetResponse(
                success=True,
                scheduled=True,
                schedule_time=request.schedule_time,
                tweet_id=reply_id
            )
        
        # Otherwise reply immediately
        result = await twitter_service.reply_to_tweet(
            tweet_id, 
            request.content, 
            request.credentials, 
            request.media_paths,
            user_id=current_user.user_id if current_user else None
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reply to tweet: {str(e)}")

@router.get("/analytics/{tweet_id}", response_model=Dict[str, Any])
async def get_tweet_analytics(tweet_id: str):
    """Get engagement analytics for a specific tweet."""
    try:
        analytics = await twitter_service.get_tweet_analytics(tweet_id)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.get("/scheduled", response_model=Dict[str, List])
async def get_scheduled_posts():
    """Get all scheduled tweets and threads."""
    return {
        "tweets": list(scheduled_tweets.values()),
        "threads": list(scheduled_threads.values())
    }

@router.delete("/scheduled/{item_id}")
async def delete_scheduled_item(item_id: str):
    """Delete a scheduled tweet or thread."""
    if item_id in scheduled_tweets:
        del scheduled_tweets[item_id]
        return {"message": f"Scheduled tweet {item_id} deleted"}
    elif item_id in scheduled_threads:
        del scheduled_threads[item_id]
        return {"message": f"Scheduled thread {item_id} deleted"}
    else:
        raise HTTPException(status_code=404, detail=f"Scheduled item {item_id} not found")

@router.post("/generate-meme", response_model=MemeGenerationResponse)
async def generate_meme(request: MemeGenerationRequest):
    """Generate a meme based on the request."""
    try:
        result = await twitter_service.generate_meme(request.template_id, request.texts, request.tweet_context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate meme: {str(e)}")

@router.post("/repurpose-content", response_model=ContentRepurposeResponse)
async def repurpose_content(request: ContentRepurposeRequest):
    """Repurpose content from a source URL."""
    try:
        result = await twitter_service.repurpose_content(
            request.source_url,
            request.content_type,
            request.output_format,
            request.tone,
            request.max_length,
            request.include_link
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to repurpose content: {str(e)}")

@router.get("/meme-templates", response_model=List[Dict[str, Any]])
async def get_meme_templates():
    """Get available meme templates."""
    try:
        templates = await twitter_service.get_meme_templates()
        return templates
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get meme templates: {str(e)}")

@router.post("/bulk-reply", response_model=List[TweetResponse])
async def bulk_reply(tweets: List[str], reply_template: str, tone: str, credentials: Dict[str, str]):
    """Generate and queue replies to multiple tweets."""
    try:
        # In a real implementation, this would use the AI service to generate replies
        # and queue them for posting
        results = []
        for i, tweet in enumerate(tweets):
            # Mock response for demonstration
            results.append(TweetResponse(
                success=True,
                tweet_id=f"mock-reply-{i}",
                tweet_url=f"https://twitter.com/user/status/mock-reply-{i}",
                scheduled=True,
                schedule_time=datetime.now() + timedelta(minutes=i*5)
            ))
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to queue bulk replies: {str(e)}")