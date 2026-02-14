"""Authentication service for user management.

Handles user registration, login, and profile retrieval.
Integrates with PostgreSQL database for user storage.
"""

import psycopg2
from app.config import settings
from app.models.auth import User
from app.utils.password import hash_password, verify_password
from fastapi import HTTPException, status


def get_db_connection():
    """Create a database connection.

    Returns:
        psycopg2 connection object

    Raises:
        HTTPException: 503 if database connection fails
    """
    try:
        conn = psycopg2.connect(settings.database_url)
        return conn
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database connection failed: {str(e)}"
        )


async def register_user(username: str, email: str, password: str, role: str) -> User:
    """Register a new user account.

    Args:
        username: Unique username
        email: Unique email address
        password: Plain text password (will be hashed)
        role: User role (USER or ADMIN)

    Returns:
        User object with created user information

    Raises:
        HTTPException: 409 if username or email already exists
        HTTPException: 503 if database operation fails
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Hash the password
        password_hash = hash_password(password)

        # Insert user into database
        cursor.execute(
            """
            INSERT INTO users (username, email, password_hash, role)
            VALUES (%s, %s, %s, %s)
            RETURNING id, username, email, role, created_at
            """,
            (username, email, password_hash, role),
        )

        user_data = cursor.fetchone()
        conn.commit()

        # Create User object
        user = User(
            id=user_data[0], username=user_data[1], email=user_data[2], role=user_data[3], created_at=user_data[4]
        )

        return user

    except psycopg2.errors.UniqueViolation as e:
        conn.rollback()
        if "username" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists",
                headers={"error_code": "USER_001"},
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already exists", headers={"error_code": "USER_002"}
            )
    except psycopg2.Error as e:
        conn.rollback()
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()


async def authenticate_user(username: str, password: str) -> User | None:
    """Authenticate a user with username and password.

    Args:
        username: Username to authenticate
        password: Plain text password to verify

    Returns:
        User object if authentication successful, None otherwise

    Raises:
        HTTPException: 503 if database operation fails
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get user from database
        cursor.execute(
            """
            SELECT id, username, email, password_hash, role, created_at
            FROM users
            WHERE username = %s
            """,
            (username,),
        )

        user_data = cursor.fetchone()

        if user_data is None:
            return None

        # Verify password
        if not verify_password(password, user_data[3]):
            return None

        # Create User object
        user = User(
            id=user_data[0], username=user_data[1], email=user_data[2], role=user_data[4], created_at=user_data[5]
        )

        return user

    except psycopg2.Error as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()


async def get_user_by_id(user_id: int) -> User | None:
    """Get user by ID.

    Args:
        user_id: User ID to retrieve

    Returns:
        User object if found, None otherwise

    Raises:
        HTTPException: 503 if database operation fails
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # Get user from database
        cursor.execute(
            """
            SELECT id, username, email, role, created_at
            FROM users
            WHERE id = %s
            """,
            (user_id,),
        )

        user_data = cursor.fetchone()

        if user_data is None:
            return None

        # Create User object
        user = User(
            id=user_data[0], username=user_data[1], email=user_data[2], role=user_data[3], created_at=user_data[4]
        )

        return user

    except psycopg2.Error as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=f"Database error: {str(e)}")
    finally:
        cursor.close()
        conn.close()
