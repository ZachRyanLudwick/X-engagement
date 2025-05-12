from fastapi import APIRouter, Depends, HTTPException, Body, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from typing import List, Optional, Dict, Any

from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import (
    UserSettings, TonePreset, AccountSettings, ScheduleSettings, 
    AnalyticsSettings, UserProfile, AuthRequest, AuthResponse
)
from app.models.twitter import TwitterCredentials, TwitterAuthRequest, TwitterAuthResponse
from app.services.user_service import (
    authenticate_user, create_user, get_user_by_id, create_auth_response,
    update_user_twitter_account, get_user_twitter_accounts, get_user_twitter_account,
    remove_user_twitter_account, set_default_twitter_account
)
from app.services.twitter_auth_service import (
    authenticate_and_link_twitter, create_twitter_auth_request, 
    get_twitter_auth_status, process_twitter_auth_request
)

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> UserProfile:
    """Get the current user from the token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    
    return user

@router.post("/auth/register", response_model=AuthResponse)
async def register(
    email: str = Body(...),
    username: str = Body(...),
    password: str = Body(...),
    name: str = Body(...)
):
    """Register a new user."""
    try:
        user = await create_user(email, username, password, name)
        return await create_auth_response(user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/auth/login", response_model=AuthResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate a user and return a session token."""
    try:
        user = await authenticate_user(form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return await create_auth_response(user)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/auth/logout")
async def logout(token: str = Body(..., embed=True)):
    """Log out a user by invalidating their session token."""
    # In a real implementation, you might want to blacklist the token
    # For now, we'll just return a success message
    return {"message": "Logged out successfully"}

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: UserProfile = Depends(get_current_user)):
    """Get the user's profile information."""
    return current_user

@router.get("/settings", response_model=UserSettings)
async def get_user_settings(current_user: UserProfile = Depends(get_current_user)):
    """Get user settings including tone presets."""
    return current_user.settings

@router.post("/settings", response_model=UserSettings)
async def update_user_settings(
    settings: UserSettings,
    current_user: UserProfile = Depends(get_current_user)
):
    """Update user settings."""
    try:
        # In a real implementation, update the settings in the database
        # For now, we'll just return the settings as if they were saved
        return settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user settings: {str(e)}"
        )

@router.post("/tone-presets", response_model=TonePreset)
async def create_tone_preset(
    preset: TonePreset,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a new custom tone preset."""
    try:
        # In a real implementation, add the preset to the user's settings in the database
        # For now, we'll just return the preset as if it was saved
        return preset
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create tone preset: {str(e)}"
        )

@router.delete("/tone-presets/{preset_name}")
async def delete_tone_preset(
    preset_name: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Delete a custom tone preset."""
    try:
        # In a real implementation, remove the preset from the user's settings in the database
        # For now, we'll just return a success message
        return {"message": f"Tone preset '{preset_name}' deleted successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete tone preset: {str(e)}"
        )

@router.post("/accounts", response_model=AccountSettings)
async def add_account(
    account: AccountSettings,
    current_user: UserProfile = Depends(get_current_user)
):
    """Add a Twitter account to the user's settings."""
    try:
        # In a real implementation, add the account to the user's settings in the database
        # For now, we'll just return the account as if it was saved
        return account
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add account: {str(e)}"
        )

@router.delete("/accounts/{account_username}")
async def delete_account(
    account_username: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Remove a Twitter account from the user's settings."""
    try:
        # In a real implementation, remove the account from the user's settings in the database
        # For now, we'll just return a success message
        return {"message": f"Account '{account_username}' removed successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove account: {str(e)}"
        )

@router.post("/schedule-settings", response_model=ScheduleSettings)
async def update_schedule_settings(
    settings: ScheduleSettings,
    current_user: UserProfile = Depends(get_current_user)
):
    """Update the user's schedule settings."""
    try:
        # In a real implementation, update the user's schedule settings in the database
        # For now, we'll just return the settings as if they were saved
        return settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update schedule settings: {str(e)}"
        )

@router.post("/analytics-settings", response_model=AnalyticsSettings)
async def update_analytics_settings(
    settings: AnalyticsSettings,
    current_user: UserProfile = Depends(get_current_user)
):
    """Update the user's analytics settings."""
    try:
        # In a real implementation, update the user's analytics settings in the database
        # For now, we'll just return the settings as if they were saved
        return settings
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update analytics settings: {str(e)}"
        )

@router.post("/ui-preferences", response_model=Dict[str, Any])
async def update_ui_preferences(
    preferences: Dict[str, Any],
    current_user: UserProfile = Depends(get_current_user)
):
    """Update the user's UI preferences."""
    try:
        # In a real implementation, update the user's UI preferences in the database
        # For now, we'll just return the preferences as if they were saved
        return preferences
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update UI preferences: {str(e)}"
        )

@router.post("/auth/twitter/request", response_model=TwitterAuthRequest)
async def request_twitter_auth(current_user: UserProfile = Depends(get_current_user)):
    """
    Start the Twitter authentication process.
    Returns a request ID that can be used to track the authentication process.
    """
    try:
        request_id = await create_twitter_auth_request(current_user.user_id)
        return {
            "request_id": request_id,
            "status": "pending",
            "error": None
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create Twitter authentication request: {str(e)}"
        )

@router.get("/auth/twitter/status/{request_id}", response_model=TwitterAuthResponse)
async def check_twitter_auth_status(request_id: str):
    """Check the status of a Twitter authentication request."""
    try:
        auth_status = await get_twitter_auth_status(request_id)
        
        if auth_status["status"] == "not_found":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Authentication request not found"
            )
        
        response = {
            "success": auth_status["status"] == "completed",
            "request_id": request_id,
            "status": auth_status["status"],
            "error": auth_status.get("error")
        }
        
        # Add Twitter data if available
        if auth_status.get("twitter_data"):
            twitter_data = auth_status["twitter_data"]
            response["username"] = twitter_data.get("username")
            response["display_name"] = twitter_data.get("display_name")
            response["profile_image_url"] = twitter_data.get("profile_image_url")
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check Twitter authentication status: {str(e)}"
        )

@router.post("/auth/twitter/authenticate/{request_id}", response_model=TwitterAuthResponse)
async def authenticate_with_twitter(
    request_id: str,
    credentials: TwitterCredentials = Body(...)
):
    """
    Authenticate with Twitter using the provided credentials.
    This is called after the user has entered their Twitter credentials.
    """
    try:
        success = await process_twitter_auth_request(request_id, credentials)
        
        if not success:
            auth_status = await get_twitter_auth_status(request_id)
            return {
                "success": False,
                "request_id": request_id,
                "status": auth_status["status"],
                "error": auth_status.get("error") or "Authentication failed"
            }
        
        auth_status = await get_twitter_auth_status(request_id)
        twitter_data = auth_status.get("twitter_data", {})
        
        return {
            "success": True,
            "request_id": request_id,
            "status": "completed",
            "username": twitter_data.get("username"),
            "display_name": twitter_data.get("display_name"),
            "profile_image_url": twitter_data.get("profile_image_url")
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Twitter authentication failed: {str(e)}"
        )

@router.post("/auth/twitter", response_model=AuthResponse)
async def twitter_login(
    credentials: TwitterCredentials,
    current_user: UserProfile = Depends(get_current_user)
):
    """Authenticate with Twitter and link the account to the user."""
    try:
        success, error_message = await authenticate_and_link_twitter(current_user.user_id, credentials)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=error_message or "Twitter authentication failed"
            )
        
        # Get updated user profile
        updated_user = await get_user_by_id(current_user.user_id)
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Create new auth response with updated user data
        return await create_auth_response(updated_user)
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Twitter authentication failed: {str(e)}"
        )

@router.get("/twitter-accounts", response_model=List[AccountSettings])
async def get_twitter_accounts(current_user: UserProfile = Depends(get_current_user)):
    """Get all Twitter accounts for the current user."""
    try:
        accounts = await get_user_twitter_accounts(current_user.user_id)
        return accounts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Twitter accounts: {str(e)}"
        )

@router.get("/twitter-accounts/{username}", response_model=AccountSettings)
async def get_twitter_account(
    username: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Get a specific Twitter account for the current user."""
    try:
        account = await get_user_twitter_account(current_user.user_id, username)
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Twitter account '{username}' not found"
            )
        return account
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get Twitter account: {str(e)}"
        )

@router.delete("/twitter-accounts/{username}")
async def delete_twitter_account(
    username: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Remove a Twitter account from the current user."""
    try:
        success = await remove_user_twitter_account(current_user.user_id, username)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Twitter account '{username}' not found or could not be removed"
            )
        return {"message": f"Twitter account '{username}' removed successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to remove Twitter account: {str(e)}"
        )

@router.post("/twitter-accounts/default/{username}")
async def set_default_account(
    username: str,
    current_user: UserProfile = Depends(get_current_user)
):
    """Set a Twitter account as the default for the current user."""
    try:
        success = await set_default_twitter_account(current_user.user_id, username)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Twitter account '{username}' not found or could not be set as default"
            )
        return {"message": f"Twitter account '{username}' set as default successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set default Twitter account: {str(e)}"
        )