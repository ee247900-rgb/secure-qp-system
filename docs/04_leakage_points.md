# Leakage Points

Throughout the lifecycle of a question paper, several vulnerabilities exist. Below are 10 identified leakage points and how this system addresses them.

### 1. Question Setters / Subject Experts
* **Description:** The subject experts who draft the initial questions might leak them to coaching centers or candidates.
* **Real-world Scenario:** A professor creates a question and shares it on WhatsApp before submitting it to the board.
* **Risk Level:** HIGH
* **Addressed By:** Questions are entered into a vast 'Question Pool'. No single setter knows which of their questions will be selected for the final compilation.

### 2. Reviewers / Moderators
* **Description:** Personnel responsible for reviewing and moderating questions have access to the pool.
* **Real-world Scenario:** A moderator copies a significant portion of the reviewed questions and sells them.
* **Risk Level:** HIGH
* **Addressed By:** Role-Based Access Control (RBAC) and Row Level Security (RLS) limit what they can see. They only see individual questions, never a compiled paper.

### 3. System Administrators / IT Staff
* **Description:** IT staff with root/admin access to the database or servers can read stored data.
* **Real-world Scenario:** A DBA exports the `questions` or `papers` table and leaks it.
* **Risk Level:** HIGH
* **Addressed By:** AES-256-GCM Encryption. The papers are encrypted before storage. The database only holds encrypted blobs. The admin does not have the decryption key.

### 4. Compromised Storage Systems
* **Description:** Cloud storage or on-premise hard drives are hacked or stolen.
* **Real-world Scenario:** A hacker breaches the cloud bucket containing the final PDFs.
* **Risk Level:** HIGH
* **Addressed By:** AES-256-GCM Encryption and Shamir's Secret Sharing (SSS). Even if stolen, the files are unreadable without the threshold of key shares.

### 5. Insecure Communication Channels
* **Description:** Interception of data while in transit between the client and server.
* **Real-world Scenario:** Man-in-the-Middle (MitM) attack captures the uploaded question paper.
* **Risk Level:** MEDIUM
* **Addressed By:** End-to-End HTTPS/TLS encryption.

### 6. Vulnerable Online Portals
* **Description:** The web portal used by setters and examiners has vulnerabilities (e.g., SQLi, Broken Auth).
* **Real-world Scenario:** An attacker uses a stolen session cookie to log in as a compiler.
* **Risk Level:** HIGH
* **Addressed By:** Multi-Factor Authentication (MFA), strict JWT expiration, and Supabase's secure infrastructure.

### 7. Printing and Exam-centre Logistics
* **Description:** Leaks occurring at the printing press or during physical transit.
* **Real-world Scenario:** A printing press worker slips a copy of the paper out in their pocket.
* **Risk Level:** HIGH
* **Addressed By:** The system eliminates centralized physical printing. Exam centres download and decrypt the paper locally just prior to the exam (Time-Locked Release).

### 8. Compromised Endpoint Devices
* **Description:** The PC used by an exam center coordinator is infected with malware.
* **Real-world Scenario:** Malware on the coordinator's PC screenshots the decrypted paper.
* **Risk Level:** MEDIUM
* **Addressed By:** Invisible and visible dynamic Watermarking tied to the specific exam center downloading the paper. This allows tracing the leak back to the source.

### 9. Insider Collusion
* **Description:** Multiple authorized individuals collude to piece together the paper.
* **Real-world Scenario:** A compiler and an IT admin team up to decrypt a paper.
* **Risk Level:** HIGH
* **Addressed By:** Shamir's Secret Sharing requires a predefined threshold (e.g., 3 out of 5 key holders) to reconstruct the key. Collusion of fewer individuals is mathematically insufficient.

### 10. Social Engineering Attacks
* **Description:** Phishing or manipulating authorized users into handing over credentials.
* **Real-world Scenario:** An examiner is tricked into revealing their password via a fake login page.
* **Risk Level:** MEDIUM
* **Addressed By:** Multi-Factor Authentication (MFA) ensures a stolen password is not enough. Comprehensive Audit Logs track all anomalous behaviors.
