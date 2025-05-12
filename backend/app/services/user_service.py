from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Union
from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.errors import DuplicateKeyError

from app.core.database import get_users_collection
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import UserProfile, UserSettings, TonePreset, AuthResponse, AccountSettings

async def create_user(email: str, username: str, password: str, name: str) -> UserProfile:
    """Create a new user."""
    users_collection = get_users_collection()
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"$or": [{"email": email}, {"username": username}]})
    if existing_user:
        if existing_user.get("email") == email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    # Create default user settings
    settings = UserSettings(
        default_tone="professional",
        tone_presets=[
            TonePreset(name="professional", description="Formal and business-like", is_default=True),
            TonePreset(name="witty", description="Clever and humorous"),
            TonePreset(name="sarcastic", description="Ironic and satirical"),
            TonePreset(name="motivational", description="Inspiring and encouraging")
        ],
        custom_tone_presets=[]
    )
    
    # Create user document
    user_doc = {
        "email": email,
        "username": username,
        "hashed_password": get_password_hash(password),
        "name": name,
        "created_at": datetime.utcnow().isoformat(),
        "settings": settings.dict(),
        "subscription_tier": "free",
        "is_active": True
    }
    
    try:
        result = await users_collection.insert_one(user_doc)
        user_doc["_id"] = str(result.inserted_id)
        
        # Convert to UserProfile model
        user_profile = UserProfile(
            user_id=str(result.inserted_id),
            email=email,
            name=name,
            created_at=user_doc["created_at"],
            settings=settings,
            subscription_tier="free",
            is_active=True
        )
        
        return user_profile
    
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )

async def authenticate_user(username_or_email: str, password: str) -> Optional[UserProfile]:
    """Authenticate a user."""
    users_collection = get_users_collection()
    
    # Find user by username or email
    user_doc = await users_collection.find_one({
        "$or": [{"username": username_or_email}, {"email": username_or_email}]
    })
    
    if not user_doc:
        return None
    
    # Verify password
    if not verify_password(password, user_doc["hashed_password"]):
        return None
    
    # Convert to UserProfile model
    settings = UserSettings(**user_doc["settings"])
    
    user_profile = UserProfile(
        user_id=str(user_doc["_id"]),
        email=user_doc["email"],
        name=user_doc.get("name"),
        created_at=user_doc["created_at"],
        settings=settings,
        subscription_tier=user_doc.get("subscription_tier", "free"),
        is_active=user_doc.get("is_active", True)
    )
    
    return user_profile

async def get_user_by_id(user_id: str) -> Optional[UserProfile]:
    """Get a user by ID."""
    users_collection = get_users_collection()
    
    try:
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return None
        
        # Convert to UserProfile model
        settings = UserSettings(**user_doc["settings"])
        
        user_profile = UserProfile(
            user_id=str(user_doc["_id"]),
            email=user_doc["email"],
            name=user_doc.get("name"),
            created_at=user_doc["created_at"],
            settings=settings,
            subscription_tier=user_doc.get("subscription_tier", "free"),
            is_active=user_doc.get("is_active", True)
        )
        
        return user_profile
    
    except Exception:
        return None

async def create_auth_response(user: UserProfile) -> AuthResponse:
    """Create an authentication response."""
    # Create access token
    access_token = create_access_token(
        data={"sub": user.user_id}
    )
    
    # Create response
    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=3600,
        user=user
    )

async def update_user_twitter_account(user_id: str, account: AccountSettings) -> bool:
    """Add or update a Twitter account for a user."""
    users_collection = get_users_collection()
    
    try:
        # Check if the account already exists
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return False
        
        settings = user_doc.get("settings", {})
        accounts = settings.get("accounts", [])
        
        # Check if this account already exists
        account_exists = False
        for i, existing_account in enumerate(accounts):
            if existing_account.get("username") == account.username:
                # Update existing account
                accounts[i] = account.dict()
                account_exists = True
                break
        
        if not account_exists:
            # Add new account
            accounts.append(account.dict())
        
        # Update settings with new accounts list
        settings["accounts"] = accounts
        
        # If this is the first account, set it as default
        if not settings.get("default_account") and accounts:
            settings["default_account"] = account.username
        
        # Update user document
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"settings": settings}}
        )
        
        return result.modified_count > 0
    
    except Exception as e:
        print(f"Error updating Twitter account: {str(e)}")
        return False

async def get_user_twitter_accounts(user_id: str) -> List[AccountSettings]:
    """Get all Twitter accounts for a user."""
    users_collection = get_users_collection()
    
    try:
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return []
        
        settings = user_doc.get("settings", {})
        accounts = settings.get("accounts", [])
        
        return [AccountSettings(**account) for account in accounts]
    
    except Exception:
        return []

async def get_user_twitter_account(user_id: str, username: str) -> Optional[AccountSettings]:
    """Get a specific Twitter account for a user."""
    accounts = await get_user_twitter_accounts(user_id)
    
    for account in accounts:
        if account.username == username:
            return account
    
    return None

async def remove_user_twitter_account(user_id: str, username: str) -> bool:
    """Remove a Twitter account from a user."""
    users_collection = get_users_collection()
    
    try:
        user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not user_doc:
            return False
        
        settings = user_doc.get("settings", {})
        accounts = settings.get("accounts", [])
        
        # Filter out the account to remove
        new_accounts = [account for account in accounts if account.get("username") != username]
        
        # If the default account is being removed, update it
        if settings.get("default_account") == username:
            settings["default_account"] = new_accounts[0].get("username") if new_accounts else None
        
        # Update settings with new accounts list
        settings["accounts"] = new_accounts
        
        # Update user document
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"settings": settings}}
        )
        
        return result.modified_count > 0
    
    except Exception:
        return False

async def set_default_twitter_account(user_id: str, username: str) -> bool:
    """Set a Twitter account as the default for a user."""
    users_collection = get_users_collection()
    
    try:
        # Check if the account exists
        account = await get_user_twitter_account(user_id, username)
        if not account:
            return False
        
        # Update the default account
        result = await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"settings.default_account": username}}
        )
        
        return result.modified_count > 0
    
    except Exception:
        return False