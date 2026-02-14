"""Password hashing utilities using bcrypt_sha256.

Provides secure password hashing and verification with passlib's
bcrypt_sha256 scheme, which pre-hashes input and avoids bcrypt's
72-byte password limit while retaining bcrypt strength.
"""

from passlib.context import CryptContext

# Configure bcrypt_sha256 context with 12 rounds (minimum security requirement)
pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto", bcrypt__rounds=12)


def hash_password(password: str) -> str:
    """Hash a plain text password using bcrypt_sha256.

    Args:
        password: Plain text password to hash

    Returns:
        Hashed password string

    Example:
        >>> hashed = hash_password("SecurePass123!")
        >>> hashed.startswith("$2b$")
        True
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password.

    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise

    Example:
        >>> hashed = hash_password("SecurePass123!")
        >>> verify_password("SecurePass123!", hashed)
        True
        >>> verify_password("WrongPassword", hashed)
        False
    """
    return pwd_context.verify(plain_password, hashed_password)
