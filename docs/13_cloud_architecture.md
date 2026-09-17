# Supabase Cloud Architecture

This project leverages Supabase as its primary cloud infrastructure provider, acting as an open-source Firebase alternative built on PostgreSQL.

## 1. Authentication (Supabase Auth)
*   **Underlying Tech:** GoTrue
*   **Role:** Handles all user authentication flows.
*   **Security Feature:** Supports Multi-Factor Authentication (MFA) out of the box (TOTP via Authenticator apps). Upon login, it issues a secure JSON Web Token (JWT) containing the user's UUID and custom claims (like `role`).

## 2. Database (PostgreSQL + RLS)
*   **Underlying Tech:** PostgreSQL 15
*   **Role:** Primary data store for all relational data.
*   **Security Feature (RLS):** Row Level Security (RLS) is the cornerstone of our defense-in-depth strategy. Instead of relying solely on the FastAPI backend to filter data, policies are written directly into PostgreSQL.
    *   *Example:* `CREATE POLICY "Setters only see their own questions" ON questions FOR SELECT USING (auth.uid() = created_by);`
    *   Even if the API is compromised or bypassed, the database will refuse to serve unauthorized rows.

## 3. Storage (Supabase Storage)
*   **Underlying Tech:** AWS S3 (under the hood of Supabase cloud)
*   **Role:** Stores the AES-encrypted PDF blobs.
*   **Security Feature:** The bucket is marked as **Private**. Direct public access is impossible. Files can only be downloaded by the FastAPI backend using the Supabase Service Role Key (which bypasses RLS).

## 4. Connection Between FastAPI and Supabase
The FastAPI backend acts as an intermediary. It uses the `supabase-py` client.
*   For routine operations, it forwards the user's JWT to Supabase to execute queries under the context of that user (enforcing RLS).
*   For critical security operations (like storing the encrypted blob or writing immutable audit logs), FastAPI uses the `SERVICE_ROLE_KEY` to perform administrative tasks that users cannot perform directly.

## 5. Security Features of Supabase
*   **PostgREST:** Provides an auto-generated API, but we route sensitive calls through FastAPI.
*   **pg_audit / Triggers:** We use PostgreSQL triggers to ensure `audit_logs` cannot be updated or deleted, providing an append-only ledger.
