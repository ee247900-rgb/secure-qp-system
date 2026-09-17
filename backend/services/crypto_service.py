import base64
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def generate_data_key() -> bytes:
    """Generate a random 256-bit (32 bytes) Data Encryption Key."""
    return os.urandom(32)

def encrypt_paper(plaintext: bytes, dek: bytes) -> dict:
    """
    Encrypt paper content using AES-256-GCM.
    
    Args:
        plaintext: Raw paper bytes (PDF)
        dek: 256-bit Data Encryption Key
    
    Returns:
        dict with keys:
        - 'ciphertext': encrypted bytes (base64 encoded string)
        - 'nonce': 12-byte nonce (base64 encoded string)
        - 'tag': 128-bit auth tag (base64 encoded string)
    """
    aesgcm = AESGCM(dek)
    nonce = os.urandom(12)
    # Encrypts and appends tag
    encrypted_data = aesgcm.encrypt(nonce, plaintext, None)
    
    ciphertext = encrypted_data[:-16]
    tag = encrypted_data[-16:]
    
    return {
        'ciphertext': base64.b64encode(ciphertext).decode('utf-8'),
        'nonce': base64.b64encode(nonce).decode('utf-8'),
        'tag': base64.b64encode(tag).decode('utf-8')
    }

def decrypt_paper(ciphertext_b64: str, nonce_b64: str, tag_b64: str, dek: bytes) -> bytes:
    """
    Decrypt paper content using AES-256-GCM.
    
    Verifies authentication tag (integrity check).
    Raises ValueError if tag verification fails (tampering detected).
    """
    try:
        ciphertext = base64.b64decode(ciphertext_b64)
        nonce = base64.b64decode(nonce_b64)
        tag = base64.b64decode(tag_b64)
    except Exception as e:
        raise ValueError(f"Invalid base64 input: {e}")

    encrypted_data = ciphertext + tag
    aesgcm = AESGCM(dek)
    
    try:
        plaintext = aesgcm.decrypt(nonce, encrypted_data, None)
        return plaintext
    except Exception as e:
        raise ValueError(f"Decryption or tag verification failed: {e}")

def encrypt_key_for_storage(dek: bytes, passphrase: str) -> str:
    """
    Encrypt the DEK using a passphrase-derived key (for prototype storage).
    Uses PBKDF2 key derivation + AES-256-GCM.
    Returns base64-encoded encrypted key with salt prepended.
    """
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(passphrase.encode())
    
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    encrypted_dek = aesgcm.encrypt(nonce, dek, None)
    
    # Prepend salt and nonce to the encrypted_dek
    combined = salt + nonce + encrypted_dek
    return base64.b64encode(combined).decode('utf-8')

def decrypt_key_from_storage(encrypted_dek_b64: str, passphrase: str) -> bytes:
    """Decrypt the DEK using the passphrase."""
    try:
        combined = base64.b64decode(encrypted_dek_b64)
    except Exception as e:
        raise ValueError(f"Invalid base64 input: {e}")
        
    if len(combined) < 28:
        raise ValueError("Invalid encrypted key format")
        
    salt = combined[:16]
    nonce = combined[16:28]
    encrypted_dek = combined[28:]
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(passphrase.encode())
    
    aesgcm = AESGCM(key)
    try:
        dek = aesgcm.decrypt(nonce, encrypted_dek, None)
        return dek
    except Exception as e:
        raise ValueError(f"Failed to decrypt key: {e}")
