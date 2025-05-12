# MongoDB Setup Guide for X-Engage AI Assistant

This guide explains how to set up MongoDB for the X-Engage AI Assistant application.

## Prerequisites

- MongoDB installed locally or a MongoDB Atlas account
- Python 3.9+
- The X-Engage AI Assistant codebase

## Setup Steps

### 1. Install MongoDB

#### Option 1: Local Installation

Follow the [official MongoDB installation guide](https://docs.mongodb.com/manual/installation/) for your operating system.

#### Option 2: MongoDB Atlas (Cloud)

1. Create a [MongoDB Atlas account](https://www.mongodb.com/cloud/atlas/register)
2. Create a new cluster
3. Configure network access to allow connections from your application
4. Create a database user with read/write permissions

### 2. Configure Environment Variables

Create a `.env` file in the `/backend` directory with the following variables:

```
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=x_engage_db
SECRET_KEY=your-secret-key-here
```

If you're using MongoDB Atlas, replace the `MONGODB_URL` with your connection string:

```
MONGODB_URL=mongodb+srv://<username>:<password>@<cluster-url>/<dbname>?retryWrites=true&w=majority
```

### 3. Install Required Python Packages

The required packages are already in the `requirements.txt` file. Install them with:

```bash
pip install -r requirements.txt
```

## Database Structure

The application uses the following collections:

1. `users` - Stores user information and authentication data
   - `_id`: ObjectId (automatically generated)
   - `email`: String (unique)
   - `username`: String (unique)
   - `hashed_password`: String
   - `name`: String
   - `created_at`: String (ISO format date)
   - `settings`: Object (user settings)
   - `subscription_tier`: String
   - `is_active`: Boolean

## Testing the MongoDB Connection

Run the provided tests to verify that the MongoDB connection is working:

```bash
cd backend
pytest tests/test_mongodb_connection.py -v
```

## Troubleshooting

### Connection Issues

- Verify that MongoDB is running
- Check that the connection string is correct
- Ensure network settings allow connections from your application
- Verify that the database user has the correct permissions

### Authentication Issues

- Make sure the database user credentials are correct
- Check that the user has read/write permissions for the database

## Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Motor (Async MongoDB Driver) Documentation](https://motor.readthedocs.io/)
- [FastAPI with MongoDB Tutorial](https://fastapi.tiangolo.com/tutorial/mongodb/)