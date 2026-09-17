# Database Schema

The system uses a PostgreSQL database. Row Level Security (RLS) is enabled on all tables.

## 1. `profiles`
Stores user information and roles.
*   **Columns:**
    *   `id` (uuid, Primary Key) - Maps to auth.users
    *   `role` (text) - Check constraint: `IN ('setter', 'reviewer', 'compiler', 'centre_coordinator', 'admin')`
    *   `full_name` (text)
    *   `email` (text, Unique)
    *   `phone` (text)
    *   `created_at` (timestamp, default now())
*   **RLS Policy:** Users can read their own profile. Admins can read all.

## 2. `subjects`
*   **Columns:**
    *   `id` (uuid, PK)
    *   `name` (text)
    *   `code` (text, Unique)
    *   `created_at` (timestamp)
*   **RLS Policy:** Publicly readable.

## 3. `exams`
*   **Columns:**
    *   `id` (uuid, PK)
    *   `title` (text)
    *   `subject_id` (uuid, FK `subjects.id`)
    *   `scheduled_time` (timestamp)
    *   `status` (text) - Check constraint: `IN ('draft', 'scheduled', 'completed')`
    *   `created_at` (timestamp)
*   **RLS Policy:** Publicly readable metadata.

## 4. `questions`
*   **Columns:**
    *   `id` (uuid, PK)
    *   `content` (text) - Encrypted or raw text depending on impl.
    *   `subject_id` (uuid, FK `subjects.id`)
    *   `created_by` (uuid, FK `profiles.id`)
    *   `difficulty` (text)
    *   `marks` (int)
    *   `status` (text) - Check constraint: `IN ('pending', 'approved', 'rejected')`
    *   `created_at` (timestamp)
*   **RLS Policy:** Setters can only read/write `created_by = auth.uid()`. Reviewers/Compilers can read `approved` questions for their assigned subjects.

## 5. `reviews`
*   **Columns:**
    *   `id` (uuid, PK)
    *   `question_id` (uuid, FK `questions.id`)
    *   `reviewer_id` (uuid, FK `profiles.id`)
    *   `status` (text)
    *   `comments` (text)
    *   `created_at` (timestamp)

## 6. `papers`
Represents the final compiled question paper metadata.
*   **Columns:**
    *   `id` (uuid, PK)
    *   `exam_id` (uuid, FK `exams.id`)
    *   `file_path` (text) - Path in Supabase Storage.
    *   `hash_sha256` (text)
    *   `signature` (text)
    *   `status` (text) - Check constraint: `IN ('compiled', 'locked', 'released')`
    *   `compiled_by` (uuid, FK `profiles.id`)
    *   `created_at` (timestamp)
*   **RLS Policy:** Nobody can read `file_path` except the backend service role.

## 7. `key_shares`
Stores the encrypted shares of the AES key.
*   **Columns:**
    *   `id` (uuid, PK)
    *   `paper_id` (uuid, FK `papers.id`)
    *   `holder_id` (uuid, FK `profiles.id`)
    *   `encrypted_share` (text) - Encrypted with the holder's public key.
    *   `is_submitted` (boolean, default false)
    *   `submitted_at` (timestamp, nullable)

## 8. `audit_logs`
Immutable ledger of all actions.
*   **Columns:**
    *   `id` (uuid, PK)
    *   `user_id` (uuid, FK `profiles.id`, nullable for system actions)
    *   `action` (text)
    *   `resource_type` (text)
    *   `resource_id` (uuid)
    *   `details` (jsonb)
    *   `ip_address` (text)
    *   `created_at` (timestamp)
*   **RLS Policy:** Insert only. No updates or deletes allowed by anyone (including admins).

## 9. `watermarks`
*   **Columns:**
    *   `id` (uuid, PK)
    *   `paper_id` (uuid, FK `papers.id`)
    *   `centre_id` (uuid, FK `exam_centres.id`)
    *   `watermark_id` (text, Unique) - Included in the PDF.
    *   `downloaded_at` (timestamp)

## 10. `exam_centres`
*   **Columns:**
    *   `id` (uuid, PK)
    *   `name` (text)
    *   `location` (text)
    *   `contact_person` (text)
    *   `coordinator_id` (uuid, FK `profiles.id`)
    *   `created_at` (timestamp)
