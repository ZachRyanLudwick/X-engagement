from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class TonePreset(BaseModel):
    """A preset for content tone."""
    name: str = Field(..., description="Name of the tone preset")
    description: str = Field(..., description="Description of the tone")
    parameters: Optional[Dict[str, float]] = Field(None, description="Optional parameters for fine-tuning")
    prompt_template: Optional[str] = Field(None, description="Custom prompt template for this tone")
    emoji: Optional[str] = Field(None, description="Emoji representing this tone")
    tags: Optional[List[str]] = Field(None, description="Tags for categorizing this tone")
    is_default: Optional[bool] = Field(False, description="Whether this is a default preset")

class AccountSettings(BaseModel):
    """Settings for a Twitter account."""
    username: str = Field(..., description="Twitter username")
    display_name: Optional[str] = Field(None, description="Display name on Twitter")
    profile_image_url: Optional[str] = Field(None, description="URL to profile image")
    is_active: bool = Field(True, description="Whether this account is active")
    auto_login: bool = Field(False, description="Whether to automatically log in")
    session_data: Optional[Dict[str, Any]] = Field(None, description="Session data for this account")

class ScheduleSettings(BaseModel):
    """Settings for post scheduling."""
    enabled: bool = Field(False, description="Whether scheduling is enabled")
    preferred_times: Optional[List[str]] = Field(None, description="Preferred times for posting")
    timezone: str = Field("UTC", description="Timezone for scheduling")
    max_posts_per_day: int = Field(5, description="Maximum posts per day")
    avoid_times: Optional[List[str]] = Field(None, description="Times to avoid posting")

class AnalyticsSettings(BaseModel):
    """Settings for analytics."""
    track_engagement: bool = Field(True, description="Whether to track engagement")
    track_sentiment: bool = Field(True, description="Whether to track sentiment")
    track_tone: bool = Field(True, description="Whether to track tone")
    auto_analyze: bool = Field(False, description="Whether to automatically analyze new posts")

class UserSettings(BaseModel):
    """User settings including tone preferences."""
    default_tone: str = Field(..., description="Default tone preset name")
    tone_presets: List[TonePreset] = Field(default_factory=list, description="Available tone presets")
    custom_tone_presets: List[TonePreset] = Field(default_factory=list, description="User-created tone presets")
    auto_schedule: Optional[bool] = Field(False, description="Whether to auto-schedule posts")
    preferred_posting_times: Optional[List[str]] = Field(None, description="Preferred times for posting")
    accounts: Optional[List[AccountSettings]] = Field(default_factory=list, description="Twitter accounts")
    default_account: Optional[str] = Field(None, description="Default Twitter account username")
    schedule_settings: Optional[ScheduleSettings] = Field(None, description="Schedule settings")
    analytics_settings: Optional[AnalyticsSettings] = Field(None, description="Analytics settings")
    ui_preferences: Optional[Dict[str, Any]] = Field(None, description="UI preferences")
    notification_settings: Optional[Dict[str, bool]] = Field(None, description="Notification settings")

class UserProfile(BaseModel):
    """User profile information."""
    user_id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    name: Optional[str] = Field(None, description="User name")
    created_at: str = Field(..., description="User creation timestamp")
    settings: UserSettings = Field(..., description="User settings")
    subscription_tier: str = Field("free", description="Subscription tier")
    is_active: bool = Field(True, description="Whether the user is active")

class AuthRequest(BaseModel):
    """Authentication request."""
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Password")
    remember_me: Optional[bool] = Field(False, description="Whether to remember the user")

class AuthResponse(BaseModel):
    """Authentication response."""
    access_token: str = Field(..., description="Access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(3600, description="Token expiration in seconds")
    refresh_token: Optional[str] = Field(None, description="Refresh token")
    user: UserProfile = Field(..., description="User profile")