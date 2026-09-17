# Security Assumptions

No system is perfectly secure. It is crucial to understand the boundaries, limitations, and assumptions of this architecture to accurately assess residual risk.

1.  **Analog/Physical Gap Exception:** Cryptography cannot prevent a legitimately authorized user from photographing the decrypted question paper displayed on their screen, or smuggling out a printed copy after it is legitimately downloaded at the exam centre. 
2.  **Watermarking is Tracing, Not Prevention:** The dynamic watermark embedded in the downloaded PDF does not *stop* a leak; it ensures that if the paper is leaked and a copy is found, authorities can definitively trace it back to the exact centre and time it was downloaded.
3.  **Audit Logs Support Forensics, Not Prevention:** Immutable audit logs are a detective control, not a preventative one. They ensure accountability but do not stop a malicious action in real-time unless tied to a live anomaly detection system.
4.  **Time-Lock is Server-Controlled:** The "Time-Lock" relies on the trusted application server enforcing the clock. It is not a mathematical time-lock puzzle. If the server's NTP clock is altered, or the server is completely rooted, the time-lock can be bypassed.
5.  **Shamir's SSS Requires Trust in the Threshold:** The Secret Sharing scheme assumes that an attacker cannot compromise the required threshold of key holders (e.g., 3 out of 5). If 3 holders collude, the system is compromised.
6.  **Academic Prototype Limitations:** This is a software-based prototype. A true production system requires Hardware Security Modules (HSMs) for key generation and cryptographic operations to ensure keys never reside in server memory.
7.  **Cloud Provider Trust:** We assume the underlying cloud provider (AWS/Supabase) is not maliciously inspecting memory state on the virtual machines running the API server, where the AES key briefly exists during decryption.
8.  **Client-Side Inspection:** Any secret handled on the client-side (React) can be extracted by the user. Therefore, the architecture assumes the client is fundamentally untrustworthy, and all security checks, encryption, and key reconstruction happen exclusively on the server.
9.  **Physical Security of Exam Centres:** The physical security of the computers at the exam centres downloading the papers is outside the scope of this system. We assume the PC used for downloading is not already compromised with screen-scraping malware.
