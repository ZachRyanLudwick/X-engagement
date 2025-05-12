from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.database import Database
from pymongo.collection import Collection

from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db: Database = None

    async def connect_to_mongo():
        """Connect to MongoDB."""
        MongoDB.client = AsyncIOMotorClient(settings.MONGODB_URL)
        MongoDB.db = MongoDB.client[settings.MONGODB_DB_NAME]
        print(f"Connected to MongoDB at {settings.MONGODB_URL}")

    async def close_mongo_connection():
        """Close MongoDB connection."""
        if MongoDB.client:
            MongoDB.client.close()
            print("Closed MongoDB connection")

    def get_collection(collection_name: str) -> Collection:
        """Get a MongoDB collection."""
        return MongoDB.db[collection_name]

# Collections
def get_users_collection() -> Collection:
    """Get the users collection."""
    return MongoDB.get_collection("users")