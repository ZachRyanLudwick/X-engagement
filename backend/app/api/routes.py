from fastapi import APIRouter

from app.api.v1 import content, twitter, user

router = APIRouter()

router.include_router(content.router, prefix="/content", tags=["content"])
router.include_router(twitter.router, prefix="/twitter", tags=["twitter"])
router.include_router(user.router, prefix="/user", tags=["user"])