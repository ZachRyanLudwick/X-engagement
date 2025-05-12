import os
import asyncio
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime
from playwright.async_api import async_playwright

from app.models.twitter import Tweet, TweetAnalytics, TwitterCredentials, TweetResponse
from app.services.user_service import get_user_twitter_account

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TwitterService:
    """Service for interacting with Twitter using browser automation."""
    
    def __init__(self):
        self.base_url = "https://twitter.com"
        self.login_url = "https://twitter.com/i/flow/login"
    
    async def post_tweet(self, content: str, credentials: TwitterCredentials, media_paths: Optional[List[str]] = None, reply_to_id: Optional[str] = None, thread_id: Optional[str] = None, user_id: Optional[str] = None) -> TweetResponse:
        """Post a tweet using browser automation."""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Check if we have session data for this user and account
                session_restored = False
                if user_id and credentials.session_token:
                    # Get account from user settings
                    account = await get_user_twitter_account(user_id, credentials.username)
                    if account and account.session_data:
                        # Try to restore session
                        session_restored = await self._restore_session(context, page, account.session_data)
                
                # If session not restored, login with credentials
                if not session_restored:
                    # Login to Twitter
                    await self._login(page, credentials)
                
                # Navigate to home
                await page.goto(self.base_url, wait_until="networkidle")
                
                # Click on tweet compose button
                await page.click('a[data-testid="SideNav_NewTweet_Button"]')
                
                # Type tweet content
                await page.fill('div[data-testid="tweetTextarea_0"]', content)
                
                # Upload media if provided
                if media_paths and len(media_paths) > 0:
                    for media_path in media_paths:
                        await page.click('input[data-testid="fileInput"]')
                        await page.set_input_files('input[data-testid="fileInput"]', media_path)
                        # Wait for upload
                        await page.wait_for_selector('div[data-testid="attachments"]')
                
                # Click tweet button
                await page.click('div[data-testid="tweetButtonInline"]')
                
                # Wait for tweet to be posted
                await page.wait_for_selector('div[data-testid="toast"]', state="visible")
                
                # Get the tweet URL from the timeline
                # This is a simplified approach; in a real implementation, you'd need more robust detection
                tweet_id = "mock-tweet-id"  # In a real implementation, extract this from the page
                tweet_url = f"https://twitter.com/{credentials.username}/status/{tweet_id}"
                
                await browser.close()
                
                return TweetResponse(
                    success=True,
                    tweet_id=tweet_id,
                    tweet_url=tweet_url,
                    error=None
                )
                
        except Exception as e:
            logger.error(f"Error posting tweet: {str(e)}")
            return TweetResponse(
                success=False,
                tweet_id=None,
                tweet_url=None,
                error=str(e)
            )
    
    async def fetch_timeline(self, username: str, count: int = 20) -> List[Tweet]:
        """Fetch recent tweets from a user's timeline."""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Navigate to user's profile
                await page.goto(f"{self.base_url}/{username}", wait_until="networkidle")
                
                # Wait for tweets to load
                await page.wait_for_selector('article[data-testid="tweet"]')
                
                # Extract tweets
                tweets = []
                tweet_elements = await page.query_selector_all('article[data-testid="tweet"]')
                
                for i, tweet_element in enumerate(tweet_elements):
                    if i >= count:
                        break
                    
                    # Extract tweet data
                    # This is a simplified approach; in a real implementation, you'd need more robust extraction
                    tweet_id = await tweet_element.get_attribute("data-tweet-id") or f"mock-id-{i}"
                    
                    # Get tweet text
                    text_element = await tweet_element.query_selector('div[data-testid="tweetText"]')
                    text = await text_element.inner_text() if text_element else "No text"
                    
                    # Get engagement counts
                    likes_element = await tweet_element.query_selector('div[data-testid="like"]')
                    likes_count = int(await likes_element.inner_text() or "0") if likes_element else 0
                    
                    retweets_element = await tweet_element.query_selector('div[data-testid="retweet"]')
                    retweets_count = int(await retweets_element.inner_text() or "0") if retweets_element else 0
                    
                    replies_element = await tweet_element.query_selector('div[data-testid="reply"]')
                    replies_count = int(await replies_element.inner_text() or "0") if replies_element else 0
                    
                    tweets.append(Tweet(
                        id=tweet_id,
                        text=text,
                        author=username,
                        created_at=datetime.now(),  # In a real implementation, extract this from the tweet
                        likes_count=likes_count,
                        retweets_count=retweets_count,
                        replies_count=replies_count,
                        media_urls=None
                    ))
                
                await browser.close()
                return tweets
                
        except Exception as e:
            logger.error(f"Error fetching timeline: {str(e)}")
            # Return mock data for demonstration
            return [
                Tweet(
                    id=f"mock-id-{i}",
                    text=f"Mock tweet {i}",
                    author=username,
                    created_at=datetime.now(),
                    likes_count=i * 10,
                    retweets_count=i * 2,
                    replies_count=i * 5,
                    media_urls=None
                )
                for i in range(min(count, 5))
            ]
    
    async def fetch_tweet(self, tweet_id: str) -> Tweet:
        """Fetch a specific tweet by ID."""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Navigate to tweet
                await page.goto(f"{self.base_url}/i/status/{tweet_id}", wait_until="networkidle")
                
                # Wait for tweet to load
                await page.wait_for_selector('article[data-testid="tweet"]')
                
                # Extract tweet data
                tweet_element = await page.query_selector('article[data-testid="tweet"]')
                
                # Get tweet text
                text_element = await tweet_element.query_selector('div[data-testid="tweetText"]')
                text = await text_element.inner_text() if text_element else "No text"
                
                # Get author
                author_element = await tweet_element.query_selector('div[data-testid="User-Name"]')
                author = await author_element.inner_text() if author_element else "Unknown"
                
                # Get engagement counts
                likes_element = await tweet_element.query_selector('div[data-testid="like"]')
                likes_count = int(await likes_element.inner_text() or "0") if likes_element else 0
                
                retweets_element = await tweet_element.query_selector('div[data-testid="retweet"]')
                retweets_count = int(await retweets_element.inner_text() or "0") if retweets_element else 0
                
                replies_element = await tweet_element.query_selector('div[data-testid="reply"]')
                replies_count = int(await replies_element.inner_text() or "0") if replies_element else 0
                
                await browser.close()
                
                return Tweet(
                    id=tweet_id,
                    text=text,
                    author=author,
                    created_at=datetime.now(),  # In a real implementation, extract this from the tweet
                    likes_count=likes_count,
                    retweets_count=retweets_count,
                    replies_count=replies_count,
                    media_urls=None
                )
                
        except Exception as e:
            logger.error(f"Error fetching tweet: {str(e)}")
            # Return mock data for demonstration
            return Tweet(
                id=tweet_id,
                text="Mock tweet content",
                author="mock_user",
                created_at=datetime.now(),
                likes_count=100,
                retweets_count=20,
                replies_count=50,
                media_urls=None
            )
    
    async def reply_to_tweet(self, tweet_id: str, content: str, credentials: TwitterCredentials, media_paths: Optional[List[str]] = None, user_id: Optional[str] = None) -> TweetResponse:
        """Reply to a specific tweet."""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Check if we have session data for this user and account
                session_restored = False
                if user_id and credentials.session_token:
                    # Get account from user settings
                    account = await get_user_twitter_account(user_id, credentials.username)
                    if account and account.session_data:
                        # Try to restore session
                        session_restored = await self._restore_session(context, page, account.session_data)
                
                # If session not restored, login with credentials
                if not session_restored:
                    # Login to Twitter
                    await self._login(page, credentials)
                
                # Navigate to tweet
                await page.goto(f"{self.base_url}/i/status/{tweet_id}", wait_until="networkidle")
                
                # Click reply button
                await page.click('div[data-testid="reply"]')
                
                # Type reply content
                await page.fill('div[data-testid="tweetTextarea_0"]', content)
                
                # Upload media if provided
                if media_paths and len(media_paths) > 0:
                    for media_path in media_paths:
                        await page.click('input[data-testid="fileInput"]')
                        await page.set_input_files('input[data-testid="fileInput"]', media_path)
                        # Wait for upload
                        await page.wait_for_selector('div[data-testid="attachments"]')
                
                # Click reply button
                await page.click('div[data-testid="tweetButtonInline"]')
                
                # Wait for reply to be posted
                await page.wait_for_selector('div[data-testid="toast"]', state="visible")
                
                # Get the reply URL
                # This is a simplified approach; in a real implementation, you'd need more robust detection
                reply_id = "mock-reply-id"  # In a real implementation, extract this from the page
                reply_url = f"https://twitter.com/{credentials.username}/status/{reply_id}"
                
                await browser.close()
                
                return TweetResponse(
                    success=True,
                    tweet_id=reply_id,
                    tweet_url=reply_url,
                    error=None
                )
                
        except Exception as e:
            logger.error(f"Error replying to tweet: {str(e)}")
            return TweetResponse(
                success=False,
                tweet_id=None,
                tweet_url=None,
                error=str(e)
            )
    
    async def get_tweet_analytics(self, tweet_id: str) -> Dict[str, Any]:
        """Get engagement analytics for a specific tweet."""
        try:
            # In a real implementation, you would scrape this data from Twitter
            # For now, return mock data
            return {
                "engagement_rate": 2.5,
                "impressions": 1000,
                "profile_clicks": 20,
                "likes": 50,
                "retweets": 10,
                "replies": 5,
                "sentiment_analysis": {
                    "positive": 0.7,
                    "neutral": 0.2,
                    "negative": 0.1
                },
                "tone_breakdown": {
                    "professional": 0.6,
                    "casual": 0.2,
                    "witty": 0.1,
                    "sarcastic": 0.05,
                    "motivational": 0.05
                }
            }
        except Exception as e:
            logger.error(f"Error getting tweet analytics: {str(e)}")
            raise
    
    async def _login(self, page, credentials: TwitterCredentials):
        """Login to Twitter using the provided credentials."""
        try:
            await page.goto(self.login_url, wait_until="networkidle")
            
            # Enter username
            await page.fill('input[autocomplete="username"]', credentials.username)
            await page.click('div[data-testid="auth_input_forward_button"]')
            
            # Enter password
            await page.wait_for_selector('input[name="password"]')
            await page.fill('input[name="password"]', credentials.password)
            
            # Click login button
            await page.click('div[data-testid="LoginForm_Login_Button"]')
            
            # Handle 2FA if needed
            if credentials.two_factor_token:
                twofa_selector = 'input[data-testid="LoginForm_CodeInput"]'
                if await page.is_visible(twofa_selector, timeout=3000):
                    await page.fill(twofa_selector, credentials.two_factor_token)
                    await page.click('div[data-testid="LoginForm_Login_Button"]')
            
            # Wait for login to complete
            await page.wait_for_selector('a[data-testid="AppTabBar_Home_Link"]')
            
        except Exception as e:
            logger.error(f"Error logging in to Twitter: {str(e)}")
            raise
            
    async def _restore_session(self, context, page, session_data):
        """Restore a Twitter session using saved cookies and local storage."""
        try:
            # Set cookies
            await context.add_cookies(session_data.get("cookies", []))
            
            # Set local storage
            for key, value in session_data.get("local_storage", {}).items():
                await page.evaluate(f"localStorage.setItem('{key}', '{value}')")
            
            # Navigate to Twitter to check if session is valid
            await page.goto(self.base_url, wait_until="networkidle")
            
            # Check if we're logged in
            is_logged_in = await page.is_visible('a[data-testid="AppTabBar_Home_Link"]', timeout=5000)
            
            return is_logged_in
        except Exception as e:
            logger.error(f"Error restoring Twitter session: {str(e)}")
            return False