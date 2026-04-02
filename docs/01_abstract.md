# 📄 `01_abstract.md`

## Abstract

Consumer-facing organisations across banking, e-commerce, healthcare, and telecommunications receive thousands of complaints daily through digital channels. Existing complaint management systems fail on three critical dimensions: they cannot prioritise emergencies dynamically, they offer no transparency into automated routing decisions, and they lack the architectural integrity required for enterprise-scale deployment. This creates operational backlogs where financial fraud reports are queued alongside minor billing inquiries, eroding both efficiency and consumer trust.

This project presents an AI-Driven Consumer Complaint Intelligence System that addresses these gaps through a hybrid three-paradigm intelligence strategy. First, a Predictive Machine Learning pipeline using TF-IDF vectorisation and Logistic Regression classifies unstructured complaint text into product categories with measurable accuracy. Second, a Rule-Based Severity Assessment Engine deterministically assigns priority levels P1 Emergency, P2 Operational, and P3 General, using keyword heuristics at zero latency, guaranteeing no emergency complaint is ever missed. Third, a Generative AI layer powered by Google Gemini produces human-readable explanations for every classification decision and autonomously drafts professional email responses. 

These three intelligence vectors are orchestrated through a Decision Engine Matrix that routes each complaint to one of three outcomes: Auto-Send, Review Required, or Escalate, based on ML confidence scores and severity level. The entire pipeline is deployed within a Five-Layer Enterprise N-Tier Architecture comprising React 19 (Presentation), Flask REST API with JWT and RBAC (Application), the Hybrid AI modules (Intelligence), SQLAlchemy ORM (Data Access), and PostgreSQL 16 (Database). 

Under the balanced internal dataset and evaluation protocol used in this study, the classification model achieved 100% accuracy. The severity engine produced sub-10 millisecond latency, while observed end-to-end API response times remained under 2 seconds in live testing conditions. Critically, the measured P1 false-negative rate was 0% in the evaluated test scope, supporting reliable emergency capture within the defined experimental setting. Overall, the system demonstrates a deployable, explainable, and domain-adaptable architecture for intelligent complaint operations, with future work focused on broader external validation across larger and more heterogeneous real-world datasets.

---

## Keywords

Consumer Complaints, Machine Learning, Generative AI, Natural Language Processing, Text Classification, Explainable AI, N-Tier Architecture, Python, Flask, Scikit-learn, Google Gemini.

---

> **📖 Single Source of Truth**: This document serves as the high-level summary of the Consumer Complaints ML + GenAI System. For additional details, see [docs/reports/03_project-summary.md](reports/03_project-summary.md).

---
