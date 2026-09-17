# Entity Relationship Diagram

The database schema is designed to enforce relational integrity and support Row Level Security (RLS). Below is the complete Entity Relationship (ER) diagram for the system.

```mermaid
erDiagram
    profiles {
        uuid id PK
        string role
        string full_name
        string email
        string phone
        timestamp created_at
    }

    subjects {
        uuid id PK
        string name
        string code
        timestamp created_at
    }

    exams {
        uuid id PK
        string title
        uuid subject_id FK
        timestamp scheduled_time
        string status
        timestamp created_at
    }

    questions {
        uuid id PK
        text content
        uuid subject_id FK
        uuid created_by FK
        string difficulty
        int marks
        string status
        timestamp created_at
    }

    reviews {
        uuid id PK
        uuid question_id FK
        uuid reviewer_id FK
        string status
        text comments
        timestamp created_at
    }

    papers {
        uuid id PK
        uuid exam_id FK
        string file_path
        string hash_sha256
        string signature
        string status
        uuid compiled_by FK
        timestamp created_at
    }

    key_shares {
        uuid id PK
        uuid paper_id FK
        uuid holder_id FK
        string encrypted_share
        boolean is_submitted
        timestamp submitted_at
    }

    audit_logs {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        uuid resource_id
        jsonb details
        string ip_address
        timestamp created_at
    }

    watermarks {
        uuid id PK
        uuid paper_id FK
        uuid centre_id FK
        string watermark_id
        timestamp downloaded_at
    }

    exam_centres {
        uuid id PK
        string name
        string location
        string contact_person
        uuid coordinator_id FK
        timestamp created_at
    }

    %% Relationships
    profiles ||--o{ questions : "creates"
    profiles ||--o{ reviews : "conducts"
    profiles ||--o{ key_shares : "holds"
    profiles ||--o{ audit_logs : "generates"
    profiles ||--o{ exam_centres : "manages"
    
    subjects ||--o{ exams : "has"
    subjects ||--o{ questions : "categorizes"
    
    exams ||--o{ papers : "requires"
    
    questions ||--o{ reviews : "receives"
    
    papers ||--o{ key_shares : "split_into"
    papers ||--o{ watermarks : "applied_to"
    
    exam_centres ||--o{ watermarks : "requests"
```
