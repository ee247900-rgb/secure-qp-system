# Deployment Diagram

This diagram shows the physical/cloud deployment architecture of the Question Paper Management System.

```mermaid
deploymentDiagram
    %% Note: Mermaid deployment diagram uses graph syntax
graph TD
    subgraph "Client Devices (Browsers)"
        Browser1["Exam Centre PC\n(React SPA)"]
        Browser2["Setter/Admin PC\n(React SPA)"]
    end

    subgraph "Cloud Infrastructure (Supabase Platform)"
        subgraph "API Gateway Layer"
            Kong["Kong API Gateway\n(HTTPS, Rate Limiting)"]
        end
        
        subgraph "Application Services"
            GoTrue["Supabase Auth (GoTrue)\nUser Mgmt & MFA"]
            StorageAPI["Storage API\nFile Upload/Download"]
        end
        
        subgraph "Data Storage"
            Postgres[(PostgreSQL 15\n+ Row Level Security)]
            S3Bucket[("Supabase Storage\n(Encrypted Blobs)")]
        end
    end

    subgraph "Custom Backend (PaaS/VPS)"
        subgraph "FastAPI Server"
            App["Uvicorn Workers"]
            Crypto["Crypto Module\n(AES, SSS, Ed25519)"]
            PDFGen["PDF Generator\nWatermarker"]
        end
    end

    %% Connections
    Browser1 -- "HTTPS (JWT)" --> Kong
    Browser2 -- "HTTPS (JWT)" --> Kong
    Browser1 -- "HTTPS" --> App
    Browser2 -- "HTTPS" --> App
    
    Kong --> GoTrue
    Kong --> StorageAPI
    Kong --> Postgres
    
    StorageAPI --> S3Bucket
    
    App -- "Validates JWT" --> GoTrue
    App -- "SQL Queries" --> Postgres
    App -- "Uploads/Downloads" --> StorageAPI
```
