import unittest
import os
import base64
from services.crypto_service import generate_data_key, encrypt_paper, decrypt_paper, encrypt_key_for_storage, decrypt_key_from_storage

class TestCrypto(unittest.TestCase):
    def test_aes_encryption_decryption(self):
        dek = generate_data_key()
        plaintext = b"This is a highly secret exam paper."
        
        encrypted = encrypt_paper(plaintext, dek)
        self.assertIn('ciphertext', encrypted)
        self.assertIn('nonce', encrypted)
        self.assertIn('tag', encrypted)
        
        decrypted = decrypt_paper(encrypted['ciphertext'], encrypted['nonce'], encrypted['tag'], dek)
        self.assertEqual(decrypted, plaintext)

    def test_tampered_ciphertext_fails(self):
        dek = generate_data_key()
        plaintext = b"Secret data"
        
        encrypted = encrypt_paper(plaintext, dek)
        
        cipher_bytes = bytearray(base64.b64decode(encrypted['ciphertext']))
        cipher_bytes[0] ^= 1  # flip a bit
        tampered_ciphertext = base64.b64encode(cipher_bytes).decode('utf-8')
        
        with self.assertRaises(ValueError):
            decrypt_paper(tampered_ciphertext, encrypted['nonce'], encrypted['tag'], dek)

    def test_key_storage_encryption(self):
        dek = generate_data_key()
        passphrase = "super_secure_passphrase"
        
        encrypted_key_b64 = encrypt_key_for_storage(dek, passphrase)
        decrypted_key = decrypt_key_from_storage(encrypted_key_b64, passphrase)
        
        self.assertEqual(dek, decrypted_key)

    def test_key_storage_wrong_password(self):
        dek = generate_data_key()
        passphrase = "password123"
        wrong_passphrase = "password1234"
        
        encrypted_key_b64 = encrypt_key_for_storage(dek, passphrase)
        
        with self.assertRaises(ValueError):
            decrypt_key_from_storage(encrypted_key_b64, wrong_passphrase)

if __name__ == "__main__":
    unittest.main()
