# AWS Service Mapping

While this prototype is built on Supabase for rapid development, the architecture is designed to be cloud-agnostic. Below is the mapping of our current components to a production-grade Amazon Web Services (AWS) environment.

| System Component | Supabase (Current Prototype) | AWS Equivalent | Description of AWS Service in this Context |
| :--- | :--- | :--- | :--- |
| **Authentication** | Supabase Auth (GoTrue) | **Amazon Cognito** | Manages user pools, identities, and enforces MFA. Issues JWTs for access control. |
| **Database** | PostgreSQL + RLS | **Amazon RDS (PostgreSQL)** | Managed relational database. We would retain PostgreSQL to keep Row Level Security (RLS) features. |
| **Storage** | Supabase Storage | **Amazon S3** | Object storage for the encrypted PDF files. Configured with Block Public Access. |
| **Access Control (RBAC)**| Supabase JWT Claims | **AWS IAM** | Identity and Access Management to restrict which Lambda functions can access S3 or KMS. |
| **Encryption / Keys** | Application-level Crypto Engine | **AWS KMS (Key Management Service)**| Hardware Security Modules (HSMs) to generate, store, and manage the master encryption keys, replacing the software-level SSS in a true enterprise setup. |
| **Audit Logging** | `audit_logs` table | **AWS CloudTrail & CloudWatch**| Immutable logging of all API requests and system events for forensic analysis. |
| **Monitoring / Security**| Custom dashboard | **Amazon GuardDuty** | Threat detection service that continuously monitors for malicious activity and unauthorized behavior. |
| **Time-based Release** | Application logic | **Amazon EventBridge** | Serverless event bus that can trigger a Lambda function exactly at the `scheduled_time` minus 30 minutes to reconstruct the key. |
| **API Layer** | FastAPI (VPS/PaaS) | **API Gateway + AWS Lambda** | Serverless architecture to handle HTTP requests, route to appropriate logic, and interact with backend services. |
