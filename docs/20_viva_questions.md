# Viva Questions & Answers

This document contains potential questions that might be asked during a project evaluation or viva voce.

### Cryptography & Encryption
**Q1: Why did you choose AES-256-GCM over AES-CBC?**
*Answer:* GCM (Galois/Counter Mode) provides Authenticated Encryption with Associated Data (AEAD). It not only encrypts the data (Confidentiality) but also generates an authentication tag that verifies the data hasn't been tampered with (Integrity). CBC mode only provides confidentiality and is vulnerable to padding oracle attacks if not implemented carefully with a separate MAC.

**Q2: What is a nonce in GCM, and why is it important?**
*Answer:* A nonce (Number Used Once) is a unique value required for the AES-GCM algorithm. It ensures that encrypting the same plaintext twice yields different ciphertexts. Reusing a nonce in GCM completely breaks the security, allowing attackers to recover the encryption key.

**Q3: Why use Ed25519 for digital signatures instead of RSA?**
*Answer:* Ed25519 (using elliptic curve cryptography) provides the same security level as a 3072-bit RSA key but with much smaller key sizes (32 bytes) and faster signature generation/verification. It is also immune to certain side-channel attacks that affect RSA.

### Shamir's Secret Sharing (SSS)
**Q4: How does Shamir's Secret Sharing work mathematically?**
*Answer:* It relies on polynomial interpolation. To share a secret with a threshold of $k$, you create a random polynomial of degree $k-1$, where the constant term (y-intercept) is the secret. You then give out points $(x, y)$ on this curve to the participants. Mathematically, it requires exactly $k$ points to uniquely determine a polynomial of degree $k-1$. With $k-1$ or fewer points, the secret remains completely undefined.

**Q5: What is GF(256) and why is it used in SSS?**
*Answer:* GF(256) is a Galois Field (finite field) of $2^8$ elements. It is used in SSS because standard arithmetic (using real numbers or infinite integers) would leak information about the secret, and floating-point math lacks precision. GF(256) ensures all calculations wrap around within a fixed size (0-255), mapping perfectly to bytes, and maintaining perfect secrecy.

### System Architecture
**Q6: What is 'Defense in Depth'? How is it applied here?**
*Answer:* It's the concept of layering multiple security controls so if one fails, others remain. Here, if the frontend auth is bypassed, the API layer blocks the request. If the API layer is bypassed, Postgres RLS blocks the query. If the database is dumped, the data is AES encrypted. 

**Q7: How does PostgreSQL Row Level Security (RLS) work compared to application-level checks?**
*Answer:* Application-level checks happen in the backend code (e.g., Python `if user.id != row.owner_id`). RLS happens inside the database engine. When a query is executed, Postgres appends the policy conditions to the query before executing it. This is far more secure because it prevents developers from accidentally writing an endpoint that forgets to check permissions.

**Q8: How do you prevent the time-lock from being bypassed?**
*Answer:* The time-lock logic resides entirely on the server. The client cannot bypass it by changing their local PC time. The server checks its own NTP-synced clock against the `scheduled_time` in the database. The only way to bypass it is to gain root access to the server and change the system clock, which is why server security is paramount.

### Limitations
**Q9: Can this system prevent someone from taking a photo of the screen?**
*Answer:* No. This is the "Analog Hole." Cryptography secures data in transit and at rest, but once data is displayed to a legitimate user, it is out of cryptographic control. We mitigate this via dynamic watermarking, which doesn't prevent the photo, but ensures the resulting photo contains the ID of the person/centre who leaked it, acting as a powerful deterrent.

**Q10: What happens if the API server goes down exactly 30 minutes before the exam?**
*Answer:* This is a Denial of Service scenario. The system architecture must rely on cloud autoscaling and high availability (multiple load-balanced instances) to ensure uptime. If the entire cloud region goes down, it becomes a business continuity issue, requiring a fallback to a secondary region.
