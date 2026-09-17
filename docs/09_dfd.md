# Data Flow Diagrams (DFD)

## Level 0: Context Diagram
This diagram shows the system boundary and external entities interacting with the Question Paper Management System.

```mermaid
flowchart TD
    QS[("Question Setter")]
    REV[("Reviewer")]
    COMP[("Compiler")]
    EC[("Exam Centre")]
    ADMIN[("Admin / Key Holder")]

    SYS(("Secure QP\nManagement\nSystem"))

    QS -- "Submits Questions" --> SYS
    SYS -- "Provides Status" --> QS

    REV -- "Reviews & Approves" --> SYS
    SYS -- "Assigns Questions" --> REV

    COMP -- "Compiles Paper" --> SYS
    SYS -- "Provides Pool Info" --> COMP

    EC -- "Requests Paper (Time T)" --> SYS
    SYS -- "Delivers Watermarked PDF" --> EC

    ADMIN -- "Authorizes Key Share" --> SYS
    SYS -- "Requests Authorization" --> ADMIN
```

---

## Level 1: Major Processes
This diagram breaks down the main system into major operational processes.

```mermaid
flowchart TD
    %% Entities
    User["User (All Roles)"]
    DB[(Database)]
    Storage[(Cloud Storage)]

    %% Processes
    P1("1.0 Authentication\n& Authz")
    P2("2.0 Question\nManagement")
    P3("3.0 Paper Compilation\n& Encryption")
    P4("4.0 Authorization\n& Release")
    P5("5.0 Audit\nLogging")

    %% Flows
    User -- "Credentials" --> P1
    P1 -- "JWT Token" --> User

    User -- "Question Data" --> P2
    P2 -- "Store Metadata" --> DB

    User -- "Compile Request" --> P3
    P2 -. "Approved Questions" .-> P3
    P3 -- "Store Encrypted Blob" --> Storage
    P3 -- "Store Metadata & Hash" --> DB

    User -- "Key Share / Download Req" --> P4
    P4 -- "Retrieve Shares/Hash" --> DB
    P4 -- "Retrieve Blob" --> Storage
    P4 -- "Decrypted & Watermarked PDF" --> User

    P1 -. "Log Event" .-> P5
    P2 -. "Log Event" .-> P5
    P3 -. "Log Event" .-> P5
    P4 -. "Log Event" .-> P5
    P5 -- "Append Log" --> DB
```

---

## Level 2: Sub-processes for Compilation & Encryption
Detailing process 3.0 (Paper Compilation & Encryption).

```mermaid
flowchart TD
    %% Inputs
    InputReq["Compile Request\n(Exam ID, Q IDs)"]
    
    %% Processes
    P3_1("3.1 Generate PDF\n(In Memory)")
    P3_2("3.2 Generate SHA-256 Hash")
    P3_3("3.3 Digitally Sign Hash")
    P3_4("3.4 AES-256-GCM Encryption")
    P3_5("3.5 Shamir's Secret Sharing")
    
    %% Data Stores
    DB[(Database)]
    Store[(Storage)]

    %% Flow
    InputReq --> P3_1
    P3_1 -- "PDF Buffer" --> P3_2
    P3_1 -- "PDF Buffer" --> P3_4
    
    P3_2 -- "Hash" --> P3_3
    P3_2 -- "Hash" --> DB
    P3_3 -- "Signature" --> DB
    
    P3_4 -- "Encrypted Blob" --> Store
    P3_4 -- "AES Key" --> P3_5
    
    P3_5 -- "Key Shares" --> DB
```
