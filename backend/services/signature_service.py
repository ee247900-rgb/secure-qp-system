import os
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

def generate_signing_keypair() -> tuple[bytes, bytes]:
    """
    Generate Ed25519 keypair.
    Returns (private_key_pem, public_key_pem) as bytes.
    """
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    return private_pem, public_pem

def load_private_key(pem_data: bytes) -> Ed25519PrivateKey:
    """Load private key from PEM bytes."""
    return serialization.load_pem_private_key(pem_data, password=None)

def load_public_key(pem_data: bytes) -> Ed25519PublicKey:
    """Load public key from PEM bytes."""
    return serialization.load_pem_public_key(pem_data)

def sign_data(data_hash: str, private_key_pem: bytes) -> str:
    """
    Sign a SHA-256 hash with Ed25519 private key.
    Returns hex-encoded signature.
    """
    private_key = load_private_key(private_key_pem)
    signature = private_key.sign(data_hash.encode('utf-8'))
    return signature.hex()

def verify_signature(data_hash: str, signature_hex: str, public_key_pem: bytes) -> bool:
    """
    Verify Ed25519 signature.
    Returns True if valid, False if invalid.
    """
    public_key = load_public_key(public_key_pem)
    try:
        signature = bytes.fromhex(signature_hex)
        public_key.verify(signature, data_hash.encode('utf-8'))
        return True
    except InvalidSignature:
        return False
    except Exception:
        return False

def save_keypair_to_files(private_path: str, public_path: str) -> None:
    """Generate and save keypair to PEM files."""
    priv, pub = generate_signing_keypair()
    
    os.makedirs(os.path.dirname(private_path) or ".", exist_ok=True)
    os.makedirs(os.path.dirname(public_path) or ".", exist_ok=True)
    
    with open(private_path, "wb") as f:
        f.write(priv)
    with open(public_path, "wb") as f:
        f.write(pub)

def load_or_create_keypair(private_path: str, public_path: str) -> tuple[bytes, bytes]:
    """Load existing keypair or create new one if files don't exist."""
    if os.path.exists(private_path) and os.path.exists(public_path):
        with open(private_path, "rb") as f:
            priv = f.read()
        with open(public_path, "rb") as f:
            pub = f.read()
        return priv, pub
    else:
        save_keypair_to_files(private_path, public_path)
        return load_or_create_keypair(private_path, public_path)
