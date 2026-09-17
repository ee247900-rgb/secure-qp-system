import unittest
import os
from services.shamir_service import split_secret, reconstruct_secret, shares_to_hex, shares_from_hex

class TestShamir(unittest.TestCase):
    def test_shamir_split_reconstruct_3_of_5(self):
        secret = os.urandom(32)  # AES-256 key
        n = 5
        k = 3
        
        shares = split_secret(secret, n, k)
        self.assertEqual(len(shares), n)
        
        reconstructed = reconstruct_secret(shares[:k], k)
        self.assertEqual(reconstructed, secret)
        
        reconstructed2 = reconstruct_secret([shares[0], shares[2], shares[4]], k)
        self.assertEqual(reconstructed2, secret)

    def test_shamir_insufficient_shares(self):
        secret = os.urandom(32)
        shares = split_secret(secret, 5, 3)
        
        with self.assertRaises(ValueError):
            reconstruct_secret(shares[:2], 3)
            
        invalid_secret = reconstruct_secret(shares[:2], 2)
        self.assertNotEqual(invalid_secret, secret)

    def test_shares_serialization(self):
        secret = b"test_secret_1234"
        shares = split_secret(secret, 3, 2)
        
        hex_shares = shares_to_hex(shares)
        self.assertEqual(len(hex_shares), 3)
        self.assertIn('index', hex_shares[0])
        self.assertIn('data', hex_shares[0])
        
        restored_shares = shares_from_hex(hex_shares)
        self.assertEqual(restored_shares, shares)

if __name__ == "__main__":
    unittest.main()
