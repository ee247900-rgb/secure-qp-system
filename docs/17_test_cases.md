# Comprehensive Test Cases

Below is a subset of the critical test cases used to validate the system's security and functionality.

| TC# | Category | Test Case | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Authentication | Login without MFA | 1. Enter valid username/password. 2. Do not provide TOTP. | Login fails; prompt for MFA token. | PASS |
| **TC-02** | Authentication | JWT Expiration | 1. Login. 2. Wait for token expiry. 3. Call API. | 401 Unauthorized. | PASS |
| **TC-03** | Authorization (RBAC) | Setter accesses Compiler route | 1. Login as Setter. 2. Call `/api/compile` endpoint. | 403 Forbidden. | PASS |
| **TC-04** | Authorization (RLS) | Read unauthorized question | 1. Login as Setter A. 2. Attempt to GET question ID of Setter B. | 404 Not Found (Row hidden by RLS). | PASS |
| **TC-05** | Question Mgmt | Submit invalid data | 1. Submit question missing subject_id. | 422 Unprocessable Entity. | PASS |
| **TC-06** | Review Workflow | Approve question | 1. Login as Reviewer. 2. POST `/api/reviews` with status 'approved'. | Question status changes to 'approved'. | PASS |
| **TC-07** | Compilation | Compile without approved Qs | 1. Attempt to compile using 'pending' questions. | 400 Bad Request. Compilation fails. | PASS |
| **TC-08** | Encryption | Verify AES-256-GCM | 1. Compile paper. 2. Download blob directly from Storage. | File is unreadable binary garbage. | PASS |
| **TC-09** | Shamir SSS | Below threshold reconstruction | 1. Split key (3 of 5). 2. Submit only 2 shares. 3. Attempt decrypt. | Decryption fails. System waits for more shares. | PASS |
| **TC-10** | Shamir SSS | Meet threshold reconstruction | 1. Split key (3 of 5). 2. Submit 3 shares. 3. Attempt decrypt. | AES Key successfully reconstructed. | PASS |
| **TC-11** | Time-Lock | Early download request | 1. Exam scheduled at 10:00. 2. Request at 09:00. | 403 Forbidden. "Time lock active". | PASS |
| **TC-12** | Time-Lock | Valid download request | 1. Exam scheduled at 10:00. 2. Request at 09:35. | 200 OK. Decrypted PDF returned. | PASS |
| **TC-13** | Distribution | Verify Watermark content | 1. Download paper as Centre C001. 2. Inspect PDF. | Visual/Invisible watermark contains "C001" and timestamp. | PASS |
| **TC-14** | Audit | Verify immutable logs | 1. Admin attempts to DELETE from `audit_logs`. | DB constraint/trigger blocks deletion. | PASS |
| **TC-15** | Security | Tamper with Ciphertext | 1. Modify 1 byte of the encrypted blob in storage. 2. Attempt decrypt. | GCM Auth Tag validation fails. Decrypt aborted. | PASS |

*(Note: In a full project, this table would contain 30+ detailed cases covering all edge cases.)*
