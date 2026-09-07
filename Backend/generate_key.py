from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import base64

# Generate a random 256-bit AES key
key = AESGCM.generate_key(bit_length=256)

print("AES_KEY=" + base64.b64encode(key).decode())