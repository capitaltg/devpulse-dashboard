"""
Encryption utilities for sensitive data.
"""

import os

from cryptography.fernet import Fernet

encryption_key = os.getenv("ENCRYPTION_KEY")


def encrypt_token(token: str) -> str:
    """
    Encrypt a token using Fernet symmetric encryption.

    Args:
        token: The token to encrypt

    Returns:
        The encrypted token as a string

    Raises:
        ValueError: If ENCRYPTION_KEY environment variable is not set
    """
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable must be set")

    # Ensure the key is bytes
    key = encryption_key.encode() if isinstance(encryption_key, str) else encryption_key

    fernet = Fernet(key)
    return fernet.encrypt(token.encode()).decode()


def decrypt_token(encrypted_token: str) -> str:
    """
    Decrypt a token using Fernet symmetric encryption.

    Args:
        encrypted_token: The encrypted token to decrypt

    Returns:
        The decrypted token as a string

    Raises:
        ValueError: If ENCRYPTION_KEY environment variable is not set
    """
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable must be set")

    # Ensure the key is bytes
    key = encryption_key.encode() if isinstance(encryption_key, str) else encryption_key

    fernet = Fernet(key)
    return fernet.decrypt(encrypted_token.encode()).decode()
