"""
Shamir's Secret Sharing Scheme over GF(256).

Splits a secret into N shares such that any K shares can reconstruct the original.
K-1 or fewer shares reveal absolutely nothing about the secret.

Uses finite field arithmetic over GF(2^8) with the irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11B).
"""
import os
import secrets
from typing import List, Tuple

# Precompute log and exp tables for GF(256)
EXP_TABLE = [0] * 512
LOG_TABLE = [0] * 256

x = 1
for i in range(255):
    EXP_TABLE[i] = x
    EXP_TABLE[i + 255] = x
    LOG_TABLE[x] = i
    x2 = x << 1
    if x2 & 0x100:
        x2 ^= 0x11B
    x = x2 ^ x

def _gf256_add(a: int, b: int) -> int:
    return a ^ b

def _gf256_mul(a: int, b: int) -> int:
    if a == 0 or b == 0:
        return 0
    return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]]

def _gf256_inv(a: int) -> int:
    if a == 0:
        raise ZeroDivisionError("GF(256) inverse of zero is undefined")
    return EXP_TABLE[255 - LOG_TABLE[a]]

def _gf256_div(a: int, b: int) -> int:
    if b == 0:
        raise ZeroDivisionError("Division by zero in GF(256)")
    if a == 0:
        return 0
    return EXP_TABLE[(LOG_TABLE[a] - LOG_TABLE[b]) % 255]

def _eval_polynomial(coefficients: List[int], x: int) -> int:
    """Evaluate a polynomial at x in GF(256)."""
    if x == 0:
        return coefficients[0]
    
    result = 0
    for i in range(len(coefficients) - 1, -1, -1):
        result = _gf256_add(_gf256_mul(result, x), coefficients[i])
    return result

def _lagrange_interpolation(shares: List[Tuple[int, int]]) -> int:
    """Reconstruct the secret byte (at x=0) using Lagrange interpolation."""
    secret = 0
    for i, (x_i, y_i) in enumerate(shares):
        numerator = 1
        denominator = 1
        for j, (x_j, y_j) in enumerate(shares):
            if i != j:
                numerator = _gf256_mul(numerator, _gf256_add(0, x_j)) # 0 - x_j = x_j in GF(256)
                denominator = _gf256_mul(denominator, _gf256_add(x_i, x_j))
        
        lagrange_poly = _gf256_div(numerator, denominator)
        term = _gf256_mul(y_i, lagrange_poly)
        secret = _gf256_add(secret, term)
        
    return secret

def split_secret(secret: bytes, n: int = 5, k: int = 3) -> List[Tuple[int, bytes]]:
    """
    Split a secret into n shares with threshold k.
    
    Args:
        secret: The secret bytes to split (e.g., a 32-byte AES key)
        n: Total number of shares to generate (2-255)
        k: Minimum shares needed to reconstruct (2-n)
    
    Returns:
        List of (x, share_bytes) tuples where x is the share index (1-n)
        and share_bytes has the same length as the secret.
    """
    if k < 2 or k > n or n > 255:
        raise ValueError("Invalid parameters: require 2 <= k <= n <= 255")
        
    shares = [[0] * len(secret) for _ in range(n)]
    
    for byte_idx, byte_val in enumerate(secret):
        # Generate k-1 random coefficients, a_0 = secret byte
        coeffs = [byte_val] + [secrets.randbelow(256) for _ in range(k - 1)]
        
        # Evaluate polynomial at x=1 to x=n
        for i in range(1, n + 1):
            eval_val = _eval_polynomial(coeffs, i)
            shares[i-1][byte_idx] = eval_val
            
    return [(i + 1, bytes(share)) for i, share in enumerate(shares)]

def reconstruct_secret(shares: List[Tuple[int, bytes]], k: int = 3) -> bytes:
    """
    Reconstruct the secret from k or more shares.
    
    Args:
        shares: List of (x, share_bytes) tuples
        k: Threshold (must have at least k shares)
    
    Returns:
        The original secret bytes.
    
    Raises:
        ValueError: If fewer than k shares provided.
    """
    if len(shares) < k:
        raise ValueError(f"Need at least {k} shares, got {len(shares)}")
        
    # We only need k shares
    shares_used = shares[:k]
    secret_len = len(shares_used[0][1])
    secret = bytearray(secret_len)
    
    for byte_idx in range(secret_len):
        byte_shares = [(x, share_bytes[byte_idx]) for x, share_bytes in shares_used]
        secret[byte_idx] = _lagrange_interpolation(byte_shares)
        
    return bytes(secret)

def shares_to_hex(shares: List[Tuple[int, bytes]]) -> List[dict]:
    """Convert shares to JSON-serializable format: [{index: int, data: hex_string}]"""
    return [{"index": idx, "data": data.hex()} for idx, data in shares]

def shares_from_hex(share_dicts: List[dict]) -> List[Tuple[int, bytes]]:
    """Convert from JSON format back to share tuples."""
    return [(d["index"], bytes.fromhex(d["data"])) for d in share_dicts]
