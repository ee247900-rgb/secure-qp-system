import hashlib

def compute_hash(data: bytes) -> str:
    """Compute SHA-256 hash of data. Returns hex digest (64 chars)."""
    return hashlib.sha256(data).hexdigest()

def verify_hash(data: bytes, expected_hash: str) -> bool:
    """Verify data matches expected SHA-256 hash."""
    return compute_hash(data) == expected_hash

def compute_file_hash(file_path: str) -> str:
    """Compute SHA-256 hash of a file (streaming, memory-efficient)."""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256.update(byte_block)
    return sha256.hexdigest()
