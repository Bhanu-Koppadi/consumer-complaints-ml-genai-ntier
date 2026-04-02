# Updated Architecture Diagrams (With Extensions)

Because IEEE papers and technical documentation require high-quality visuals, I have generated **Mermaid based diagrams** for you. Mermaid is an industry-standard charting language that renders automatically in GitHub, GitLab, Notion, and many Markdown editors.

You can paste these directly into any Mermaid-supported Markdown viewer or use the [Mermaid Live Editor](https://mermaid.live/) to convert them into high-resolution PNG/SVG images for your IEEE paper!

---

## 1. Hybrid System Architecture Diagram

This diagram completely replaces the old layer diagrams. It clearly maps your unique extensions: the **Severity & Decision Engine** and the **Auto-Email Dispatcher**.

```mermaid
graph TD
    %% Presentation Layer
    subgraph Presentation Layer
        UI[Consumer / Admin UI <br/> React + TypeScript]
    end

    %% Application Layer
    subgraph Application Layer
        API[Flask REST API Gateway]
        Auth[Authentication <br/> JWT + RBAC]
    end

    %% Hybrid Intelligence Layer (THE EXTENSION)
    subgraph Hybrid AI / Intelligence Layer
        direction LR
        NLP[Text Preprocessing NLP]
        ML[Predictive Model <br/> TF-IDF + Logistic Regression]
        Sev[Rule-Based <br/> Severity Assessment]
        Dec[Decision Engine Matrix]
        GenAI[Generative AI Service <br/> Google Gemini]
        AutoSend[Auto-Email Drafter & Dispatcher]
    end

    %% Data Layer
    subgraph Data Access & Persistence Layer
        ORM[SQLAlchemy ORM]
        DB[(PostgreSQL Database)]
    end

    %% Connections
    UI -- "Submit Complaint \n (JWT Secured)" --> API
    API <--> Auth
    
    API -- "Raw Text" --> NLP
    NLP -- "Cleaned Tokens" --> ML
    ML -- "Category + Confidence" --> Dec
    API -- "Raw Text" --> Sev
    Sev -- "Priority (P1, P2, P3)" --> Dec
    Dec -- "Action (Auto-Send, Review, Escalate)" --> API
    
    API -- "Context" --> GenAI
    GenAI -- "Explainable Rationale" --> API
    GenAI -- "Drafted Response" --> AutoSend
    API -- "Trigger Auto-Response" --> AutoSend
    AutoSend -. "Emails Resolution directly" .-> UI
    
    API <--> ORM
    ORM <--> DB
```

---

## 2. Updated Sequence Diagram

This sequence replaces the mentor's sequence. Note the new split path (`alt`) at the bottom where the system intelligently decides whether to Auto-Send an email or queue it for review based on your **Decision Engine**.

```mermaid
sequenceDiagram
    actor User
    participant Frontend UI
    participant Flask API
    participant Hybrid Intelligence
    participant GenAI (Gemini)
    participant Email Dispatcher
    participant PostgreSQL

    User->>Frontend UI: Submit Complaint
    Frontend UI->>Flask API: POST /api/classify (JWT)
    
    Flask API->>Hybrid Intelligence: Send raw complaint text
    Hybrid Intelligence-->>Flask API: Return Category, Confidence, Severity, Routing Action
    
    Flask API->>GenAI (Gemini): Request Interpretation & Draft Response
    GenAI (Gemini)-->>Flask API: Return AI Explanation + Email Draft
    
    Flask API->>PostgreSQL: Save Complaint, ML Classification, AI Explanation
    PostgreSQL-->>Flask API: Acknowledge Save
    
    alt Action == "Auto-Send" (High Confidence, Low Severity)
        Flask API->>Email Dispatcher: Dispatch GenAI Drafted Email
        Email Dispatcher-->>User: Delivery: "Your complaint is resolved: ..."
        Flask API->>PostgreSQL: Update workflow status to "Auto-Sent"
    else Action == "Review" or "Escalate"
        Flask API->>PostgreSQL: Queue in Admin Dashboard for human review
    end
    
    Flask API-->>Frontend UI: Return JSON (ID, Category, Explanation, Severity)
    Frontend UI-->>User: Render Classification & Rationale visually
```

---

## 3. Updated Entity Relationship Diagram (ERD)

This completely updates the mentor's database schema diagram. Look at the `classification_results` table—it now accurately reflects all the powerful workflow columns you added!

```mermaid
erDiagram
    users ||--o{ complaints : "submits"
    complaints ||--|| classification_results : "has"
    complaints ||--|| ai_explanations : "explained_by"

    users {
        int id PK
        varchar username UK
        varchar email UK
        varchar password_hash
        varchar role
        timestamp created_at
    }

    complaints {
        int id PK
        int user_id FK
        text complaint_text
        timestamp created_at
    }

    classification_results {
        int id PK
        int complaint_id FK
        varchar category
        float confidence
        varchar severity "The Extension: High / Medium / Low"
        varchar priority "The Extension: P1 / P2 / P3"
        varchar recommended_action "Auto-Send / Review / Escalate"
        varchar response_status "Pending / Auto-Sent / Escalated"
        text draft_response_text
        text final_response_text
        varchar sent_to_email
        timestamp created_at
    }

    ai_explanations {
        int id PK
        int complaint_id FK
        text explanation
        timestamp created_at
    }
```
