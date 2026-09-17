# Supabase Feature Mapping

This document details exactly how specific Supabase features are utilized to implement the security requirements of the Question Paper Management System.

## 1. Authentication (Auth)
*   **User Management:** Centralized repository for all user profiles (setters, reviewers, admins).
*   **MFA (Multi-Factor Authentication):** Enforced via Supabase's Enrollment API. We require TOTP setup before a user can access sensitive roles (like Compiler or Key Holder).
*   **JWT Tokens:** Supabase generates JWTs upon login. We inject custom claims (e.g., `role: 'compiler'`) into these tokens using Auth Hooks, allowing Postgres to read the role directly from the token.

## 2. Database (PostgreSQL)
*   **PostgreSQL Core:** Reliable, ACID-compliant storage for all state.
*   **Row Level Security (RLS):** The most critical feature. We write SQL policies that read `auth.uid()` from the JWT and automatically filter queries. This means a vulnerability in the frontend or backend cannot bypass data access rules.
*   **Triggers:** Used to enforce immutability. A `BEFORE UPDATE OR DELETE ON audit_logs` trigger throws an exception, preventing tampering.
*   **Functions (Stored Procedures):** Complex transactional logic (like atomic status updates) is pushed to Postgres functions to prevent race conditions.

## 3. Storage
*   **Buckets:** We use a bucket named `encrypted_papers`.
*   **Access Policies:** The bucket is private. RLS policies on the `storage.objects` table deny all direct SELECT access.
*   **Signed URLs:** The FastAPI backend uses the Service Role key to generate a short-lived (e.g., 60 seconds) signed URL only when an exam centre legitimately requests a download at the correct time.

## 4. Realtime (Optional/Future Enhancement)
*   **Audit Log Streaming:** Supabase Realtime can be used to stream `INSERT` events on the `audit_logs` table to a central admin dashboard, providing a live view of system activity and immediate alerts for anomalous behavior.

## 5. Edge Functions vs. FastAPI
*   **Comparison:** Supabase offers Edge Functions (Deno/Typescript). While useful, we opted for **FastAPI (Python)** for this prototype because Python has superior, more mature cryptographic libraries (`cryptography`, `pycryptodome`) required for implementing AES-256-GCM, Ed25519 signatures, and Shamir's Secret Sharing cleanly.
