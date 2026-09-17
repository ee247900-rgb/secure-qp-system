import unittest
from services.signature_service import generate_signing_keypair, sign_data, verify_signature

class TestSignature(unittest.TestCase):
    def test_sign_and_verify(self):
        priv, pub = generate_signing_keypair()
        data_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        
        signature = sign_data(data_hash, priv)
        is_valid = verify_signature(data_hash, signature, pub)
        self.assertTrue(is_valid)

    def test_verify_wrong_data(self):
        priv, pub = generate_signing_keypair()
        data_hash = "abc123"
        signature = sign_data(data_hash, priv)
        
        wrong_hash = "def456"
        is_valid = verify_signature(wrong_hash, signature, pub)
        self.assertFalse(is_valid)

    def test_verify_wrong_key(self):
        priv1, pub1 = generate_signing_keypair()
        priv2, pub2 = generate_signing_keypair()
        
        data_hash = "1234567890abcdef"
        signature = sign_data(data_hash, priv1)
        
        is_valid = verify_signature(data_hash, signature, pub2)
        self.assertFalse(is_valid)

if __name__ == "__main__":
    unittest.main()
