import asyncio
import logging
from typing import Dict, Optional, Tuple
from playwright.async_api import async_playwright, Page
from app.models.twitter import TwitterCredentials
from app.models.user import UserProfile, AccountSettings
from app.services.user_service import get_user_by_id, update_user_twitter_account

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TwitterAuthService:
    """Service for Twitter authentication using browser automation."""
    
    def __init__(self):
        self.base_url = "https://twitter.com"
        self.login_url = "https://twitter.com/i/flow/login"
    
    async def authenticate_with_twitter(self, username: str, password: str, two_factor_token: Optional[str] = None) -> Tuple[bool, Dict, Optional[str]]:
        """
        Authenticate with Twitter using browser automation.
        Returns a tuple of (success, user_data, error_message)
        """
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                page = await context.new_page()
                
                # Navigate to Twitter login page
                await page.goto(self.login_url, wait_until="networkidle")
                
                # Enter username
                await page.fill('input[autocomplete="username"]', username)
                await page.click('div[data-testid="auth_input_forward_button"]')
                
                # Check if we need to enter verification (unusual activity)
                verification_selector = 'input[data-testid="ocfEnterTextTextInput"]'
                if await page.is_visible(verification_selector, timeout=3000):
                    logger.info("Unusual activity detected, verification required")
                    return False, {}, "Twitter requires additional verification. Please log in through the Twitter website first."
                
                # Enter password
                try:
                    await page.wait_for_selector('input[name="password"]', timeout=5000)
                    await page.fill('input[name="password"]', password)
                    
                    # Click login button
                    await page.click('div[data-testid="LoginForm_Login_Button"]')
                except Exception as e:
                    logger.error(f"Error during password entry: {str(e)}")
                    return False, {}, "Invalid username or password"
                
                # Check for 2FA if needed
                twofa_selector = 'input[data-testid="LoginForm_CodeInput"]'
                if await page.is_visible(twofa_selector, timeout=3000):
                    if not two_factor_token:
                        await browser.close()
                        return False, {}, "Two-factor authentication required"
                    
                    await page.fill(twofa_selector, two_factor_token)
                    await page.click('div[data-testid="LoginForm_Login_Button"]')
                
                # Wait for login to complete
                try:
                    await page.wait_for_selector('a[data-testid="AppTabBar_Home_Link"]', timeout=10000)
                except Exception as e:
                    logger.error(f"Login failed: {str(e)}")
                    # Check for specific error messages
                    error_message = await self._extract_error_message(page)
                    await browser.close()
                    return False, {}, error_message or "Login failed"
                
                # Extract user data
                user_data = await self._extract_user_data(page)
                
                # Extract cookies and local storage for session persistence
                cookies = await context.cookies()
                local_storage = await self._extract_local_storage(page)
                
                session_data = {
                    "cookies": cookies,
                    "local_storage": local_storage
                }
                
                await browser.close()
                
                return True, {**user_data, "session_data": session_data}, None
                
        except Exception as e:
            logger.error(f"Error authenticating with Twitter: {str(e)}")
            return False, {}, f"Authentication error: {str(e)}"
    
    async def restore_twitter_session(self, session_data: Dict) -> bool:
        """Restore a Twitter session using saved cookies and local storage."""
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context()
                
                # Set cookies
                await context.add_cookies(session_data.get("cookies", []))
                
                page = await context.new_page()
                
                # Set local storage
                for key, value in session_data.get("local_storage", {}).items():
                    await page.evaluate(f"localStorage.setItem('{key}', '{value}')")
                
                # Navigate to Twitter to check if session is valid
                await page.goto(self.base_url, wait_until="networkidle")
                
                # Check if we're logged in
                is_logged_in = await page.is_visible('a[data-testid="AppTabBar_Home_Link"]', timeout=5000)
                
                await browser.close()
                
                return is_logged_in
                
        except Exception as e:
            logger.error(f"Error restoring Twitter session: {str(e)}")
            return False
    
    async def _extract_user_data(self, page: Page) -> Dict:
        """Extract user data from the Twitter page."""
        try:
            # Wait for the profile button to be visible
            await page.wait_for_selector('div[data-testid="SideNav_AccountSwitcher_Button"]')
            
            # Click on the profile button to open the menu
            await page.click('div[data-testid="SideNav_AccountSwitcher_Button"]')
            
            # Wait for the menu to appear
            await page.wait_for_selector('div[data-testid="UserCell"]')
            
            # Extract username and display name
            username_element = await page.query_selector('div[data-testid="UserCell"] div[dir="ltr"] span')
            display_name_element = await page.query_selector('div[data-testid="UserCell"] div[dir="auto"] span')
            
            username = await username_element.inner_text() if username_element else ""
            display_name = await display_name_element.inner_text() if display_name_element else ""
            
            # Extract profile image URL
            img_element = await page.query_selector('div[data-testid="UserCell"] img')
            profile_image_url = await img_element.get_attribute('src') if img_element else ""
            
            # Close the menu by clicking elsewhere
            await page.click('div[data-testid="primaryColumn"]')
            
            return {
                "username": username.replace("@", ""),
                "display_name": display_name,
                "profile_image_url": profile_image_url
            }
            
        except Exception as e:
            logger.error(f"Error extracting user data: {str(e)}")
            return {
                "username": "",
                "display_name": "",
                "profile_image_url": ""
            }
    
    async def _extract_local_storage(self, page: Page) -> Dict:
        """Extract local storage data from the page."""
        try:
            local_storage = await page.evaluate("""() => {
                const items = {};
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    items[key] = localStorage.getItem(key);
                }
                return items;
            }""")
            return local_storage
        except Exception as e:
            logger.error(f"Error extracting local storage: {str(e)}")
            return {}
    
    async def _extract_error_message(self, page: Page) -> Optional[str]:
        """Extract error message from the login page."""
        try:
            error_selector = 'div[data-testid="LoginForm_Error"]'
            if await page.is_visible(error_selector, timeout=1000):
                error_element = await page.query_selector(error_selector)
                if error_element:
                    return await error_element.inner_text()
            return None
        except Exception:
            return None

async def authenticate_and_link_twitter(user_id: str, twitter_credentials: TwitterCredentials) -> Tuple[bool, Optional[str]]:
    """
    Authenticate with Twitter and link the account to the user.
    Returns a tuple of (success, error_message)
    """
    twitter_auth_service = TwitterAuthService()
    
    # Authenticate with Twitter
    success, twitter_data, error_message = await twitter_auth_service.authenticate_with_twitter(
        twitter_credentials.username,
        twitter_credentials.password,
        twitter_credentials.two_factor_token
    )
    
    if not success:
        return False, error_message
    
    # Get user
    user = await get_user_by_id(user_id)
    if not user:
        return False, "User not found"
    
    # Create account settings
    account_settings = AccountSettings(
        username=twitter_data["username"],
        display_name=twitter_data["display_name"],
        profile_image_url=twitter_data["profile_image_url"],
        is_active=True,
        auto_login=True,
        session_data=twitter_data["session_data"]
    )
    
    # Update user with Twitter account
    success = await update_user_twitter_account(user_id, account_settings)
    if not success:
        return False, "Failed to update user with Twitter account"
    
    return True, None