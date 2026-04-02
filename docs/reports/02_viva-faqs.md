# Viva Preparation: Base Papers, Novelty, and Extensions

Date: 2026-03-31

## 1) Is This Project New?

Short answer: the problem domain is not new, but your exact end-to-end system integration is a valid extension.

- Not new: complaint text classification using NLP/ML already has many prior papers.
- Potentially novel in your implementation: combining deterministic ML classification, rule-based severity routing, GenAI explanation, and response workflow in one deployable N-tier pipeline.

## 2) Base Papers and Prior Work (For Literature Survey)

Use these as base/related papers when explaining prior art.

### A. Core Complaint Classification Papers

1. A. Shaukat and U. Saif, "NLP based Model for Classification of Complaints: Autonomous and Intelligent System," 2022.
	- Source: Google Scholar entry and PDF mirror
	- Link: https://scholar.google.com/scholar?q=NLP+based+Model+for+Classification+of+Complaints%3A+Autonomous+and+Intelligent+System
	- Relevance: demonstrates classical NLP + ML complaint auto-classification pipeline.

2. V. Vinayak and C. Jyotsna, "Consumer complaints classification using deep learning and word embedding models," 2023.
	- Source: IEEE Xplore indexed via Scholar
	- Link: https://ieeexplore.ieee.org/abstract/document/10307286/
	- Relevance: shows DL/embedding-based complaint categorization into predefined classes.

3. P. Gao et al., "NLP-based detection of systematic anomalies among the narratives of consumer complaints," arXiv:2308.11138, 2023/2024.
	- Link: https://arxiv.org/abs/2308.11138
	- Relevance: extends beyond simple classification to anomaly detection in complaint narratives.

4. P. Gao et al., "Performance of diverse evaluation metrics in NLP-based assessment and text generation of consumer complaints," arXiv:2506.21623, 2025.
	- Link: https://arxiv.org/abs/2506.21623
	- Relevance: compares evaluation choices and text-generation aspects for complaint processing.

### B. Recent LLM-Focused Complaint Papers

5. K. I. Roumeliotis, N. D. Tselikas, and D. K. Nasiopoulos, "Think Before You Classify: The Rise of Reasoning Large Language Models for Consumer Complaint Detection and Classification," Electronics, vol. 14, no. 6, 1070, 2025.
	- DOI: https://doi.org/10.3390/electronics14061070
	- Relevance: zero-shot LLM and reasoning-model comparison for financial complaint classes.

6. R. K. Singh et al., "Talk, Snap, Complain: Validation-Aware Multimodal Expert Framework for Fine-Grained Customer Grievances," arXiv:2511.14693, 2025.
	- Link: https://arxiv.org/abs/2511.14693
	- Relevance: multimodal complaint understanding with aspect+severity focus.

### C. Adjacent Explainability / Complaint Interpretation Papers

7. S. Das et al., "Negative Review or Complaint? Exploring Interpretability in Financial Complaints," IEEE Transactions on Computational Social Systems, 2024.
	- DOI: https://doi.org/10.1109/TCSS.2023.3338357
	- Relevance: interpretability-focused differentiation in financial complaint text.

8. J. Bl"umel and M. Zaki, "Comparative analysis of classical and deep learning-based NLP for prioritizing customer complaints," 2022.
	- Link: https://scholarspace.manoa.hawaii.edu/items/ff425d6f-c12d-4b08-9a18-a20264a55b5b
	- Relevance: shows prioritization challenge and baseline model comparisons.

## 3) Gap Analysis: Previous Work vs Your Extension

## What most previous papers do well

- They classify complaint text into categories.
- Some compare ML vs DL vs LLM models on accuracy metrics.
- Some discuss interpretability, prioritization, or anomaly detection separately.

## What is usually missing in previous papers

- End-to-end production workflow from intake to operational action.
- Explicit decision policy combining confidence + severity + routing.
- Integrated complaint lifecycle fields (drafting, sending, status transitions).
- Combined RBAC auth, admin override flows, and API-level governance in one system artifact.

## What your project extends

- N-tier deployable architecture with frontend, API, ML/GenAI services, and DB persistence.
- Hybrid intelligence path:
  - deterministic ML classifier for stable category prediction,
  - rule-based severity detector for business-critical triage,
  - GenAI module for explanation and response drafting.
- Operational decision engine (auto_send, review_required, escalate) instead of only label prediction.
- Response workflow support in schema and APIs (draft/final response, delivery mode, status updates).
- Security and governance: JWT auth, role-based endpoints, admin response controls.

## 4) Suggested Novelty Statement (Use in Viva)

"Our novelty is not inventing complaint classification itself. The novelty is engineering an end-to-end enterprise-grade Complaint Intelligence workflow that unifies category prediction, severity-aware routing, explainability, and actionability (including response drafting/sending) inside a secure N-tier architecture. Existing literature often studies these pieces in isolation, while our system operationalizes them together."

## 5) Viva Questions and Model Answers

### Q1. Is your project idea completely new?
Answer: No, complaint classification is an established research area. Our contribution is system-level integration and workflow operationalization, not claiming first-ever classification.

### Q2. What are your base papers?
Answer: We used prior works on complaint classification (ML/DL), LLM-based complaint detection, and interpretability studies, including arXiv 2308.11138, arXiv 2506.21623, Electronics 2025 (DOI:10.3390/electronics14061070), and IEEE-indexed complaint classification studies.

### Q3. What is the exact research gap you identified?
Answer: Most works stop at prediction metrics. They do not fully connect prediction to severity-based routing, explainable outputs, response workflow actions, and secure role-based API operations in one deployable architecture.

### Q4. What did you extend beyond previous studies?
Answer: We added a deterministic severity+priority engine, confidence-aware decision routing, GenAI explanation and drafting, and persisted lifecycle tracking for complaint handling status.

### Q5. Why not use only an LLM for everything?
Answer: Pure LLM routing can be costlier and less deterministic. We use classical ML for stable fast classification, then use GenAI where natural-language generation adds value (explanation and response drafting).

### Q6. How do you justify novelty if components already exist?
Answer: Novelty can be combinational and architectural. We combine known methods into a robust workflow artifact with clear operational decision logic and governance boundaries.

### Q7. What practical benefit does your extension provide?
Answer: It reduces manual triage load, improves transparency, and moves from passive prediction to actionable complaint handling with automated/assisted response paths.

### Q8. What are your major limitations versus state-of-the-art papers?
Answer: Current classifier baseline is TF-IDF + Logistic Regression, dataset scale is moderate, and we do not yet report broad benchmark comparisons with many SOTA models.

### Q9. How will you strengthen the paper contribution?
Answer: Add benchmark experiments against stronger DL/LLM baselines, ablation of severity/routing modules, and response-quality evaluation with human judges.

### Q10. How do you answer "this is just implementation" criticism?
Answer: We frame it as applied research in AI systems engineering: a validated architecture that translates isolated NLP research ideas into a reproducible operational decision system.

### Q11. What extension can become your next publication?
Answer: Multilingual complaint intelligence with domain adaptation, fairness audits, and human-in-the-loop policy learning for escalation decisions.

### Q12. One-line contribution for viva panel?
Answer: "We extended complaint classification into a full Complaint Intelligence pipeline that classifies, prioritizes, explains, and operationally routes grievances under a secure enterprise architecture."

## 6) Ready-to-Say Comparison Script (30-45 seconds)

"Existing papers already show that NLP/ML can classify complaints. Some recent papers also test LLMs in zero-shot settings. Our extension is that we do not stop at category prediction. We built an end-to-end N-tier system where classification output is fused with severity rules to trigger decision routing, then explained and converted into actionable response workflow states. So the contribution is system-level operational intelligence, not just standalone model accuracy."

## 7) Citation Safety Notes

- Prefer papers with DOI/arXiv/IEEE links in final thesis bibliography.
- Verify IEEE metadata manually before final submission because automated fetch on IEEE pages may be blocked.
- Keep claims conservative: "extends prior work" and "integrates modules" are safer than "first ever" claims.

## 8) Novelty Defense Scenarios (High-Probability Viva Cases)

Use this section when panel members challenge novelty from different angles.

### Scenario 1: "Complaint classification already exists. Where is novelty?"
Answer frame:
- Acknowledge prior work.
- State your novelty as workflow integration.
- Mention end-to-end operational action, not only class label.
Ready line:
"Yes, classification exists. Our novelty is converting classification into an operational complaint-intelligence pipeline with severity-aware routing, explainability, and response workflow orchestration under one N-tier system."

### Scenario 2: "You are using known algorithms (TF-IDF + Logistic Regression)."
Answer frame:
- Explain that method novelty is not claimed.
- Defend systems novelty, governance, and deployability.
Ready line:
"Algorithmic novelty is not our claim. Our contribution is systems engineering novelty: policy-coupled routing, role-governed actions, and complaint lifecycle automation around a reliable baseline model."

### Scenario 3: "This is just implementation, not research."
Answer frame:
- Position as applied AI systems research.
- Highlight design decisions and measurable outcomes.
Ready line:
"This is applied AI research because we formalize design choices, map them to literature gaps, and validate an integrated architecture that transforms isolated models into an actionable decision system."

### Scenario 4: "Why not use only an LLM?"
Answer frame:
- Discuss determinism, cost, latency, and reliability.
- Explain hybrid rationale.
Ready line:
"A pure LLM path may reduce determinism and increase cost/latency. We use deterministic ML for stable classification and GenAI only where language generation adds value, like explanation and draft responses."

### Scenario 5: "Your novelty sounds like product engineering, not scientific contribution."
Answer frame:
- Emphasize reproducible architecture and policy logic.
- Show transferable design pattern.
Ready line:
"The scientific contribution is a reproducible architecture pattern for complaint intelligence, including decision policy coupling, explainability layer placement, and governance boundaries applicable across domains."

### Scenario 6: "Others also do explainability and complaint handling."
Answer frame:
- Distinguish by combination and orchestration sequence.
- Mention lifecycle persistence and admin workflow.
Ready line:
"Existing studies often treat explanation, classification, or prioritization separately. We operationalize all of them in one persisted lifecycle, including routing states and admin-controlled response workflow."

### Scenario 7: "Where is the measurable evidence of extension?"
Answer frame:
- Reference measurable system artifacts.
- Mention routable states and API-level behavior.
Ready line:
"Our extension is measurable in system behavior: each complaint moves through explicit states (auto_send/review_required/escalate), with persisted workflow metadata and role-controlled endpoints."

### Scenario 8: "Your dataset is limited. Can novelty still stand?"
Answer frame:
- Separate novelty claim from SOTA accuracy claim.
- Admit limitation and future scaling plan.
Ready line:
"Yes, because our novelty claim is architectural and workflow-oriented, not state-of-the-art benchmark dominance. We explicitly list dataset scale as a limitation and propose broader evaluation as future work."

### Scenario 9: "How is this different from a standard ticketing system?"
Answer frame:
- Compare with static ticket pipelines.
- Emphasize AI-assisted triage + explainability + automation.
Ready line:
"Traditional ticketing systems route by fixed rules or manual tags. Our system adds AI-driven category prediction, severity-sensitive policy routing, and explainable decision support with assisted response generation."

### Scenario 10: "Does your work generalize beyond finance complaints?"
Answer frame:
- Highlight modular design and policy abstraction.
- Explain domain adaptation path.
Ready line:
"Yes. Category taxonomy and severity rules are configurable, while the architecture remains unchanged. The pattern generalizes to telecom, healthcare, and e-commerce complaint operations."

### Scenario 11: "If prior papers already discuss prioritization, what is your extension?"
Answer frame:
- Prior work: prioritization as analysis output.
- Yours: prioritization as executable workflow trigger.
Ready line:
"Earlier work often reports prioritization scores. We convert priority into executable system actions and persisted workflow states, connecting model inference directly to operational response logic."

### Scenario 12: "How do you avoid overclaiming novelty?"
Answer frame:
- Explicitly say what is not novel.
- Then state exact contribution.
Ready line:
"We do not claim first-ever complaint classification or first-ever LLM usage. We claim a validated, integrated complaint-intelligence workflow that unifies prediction, severity policy, explainability, and actionability."

## 9) Defense Matrix: Previous vs Yours (Quick Table)

| Dimension | Typical Prior Papers | Your Project Extension |
|---|---|---|
| Objective | Classification accuracy | End-to-end complaint intelligence operations |
| Output | Category label (sometimes score) | Category + severity + routing decision + response workflow state |
| Explainability | Often optional or post-hoc | Integrated GenAI explanation in runtime path |
| Actionability | Manual next-step interpretation | Direct policy-driven actions (auto_send/review/escalate) |
| Governance | Limited production controls | JWT auth, RBAC, admin control points |
| Persistence | Prediction-centric records | Lifecycle tracking (draft/final/sent/status) |
| Deployment View | Model-centric | N-tier deployable architecture |

## 10) "If Panel Pushes Hard" Backup Scripts

### Script A: Conservative academic framing
"Our work is an applied extension paper. We integrate known NLP/ML and GenAI methods into a reproducible complaint-intelligence architecture, focusing on operationalization rather than proposing a new classifier family."

### Script B: Engineering-novelty framing
"Novelty here is at the system and policy orchestration layer: confidence and severity jointly control automated action, while explanation and response generation are embedded into governed workflows."

### Script C: Industry-impact framing
"Previous studies largely stop at model output. Our extension maps output to accountable business action under explicit security and workflow controls, which is the practical gap in many complaint-NLP studies."

## 11) Claim Boundaries (Use These Exactly)

Safe claims:
- "We extend prior complaint classification work by integrating decision policy and response workflow automation."
- "Our contribution is architectural integration and operationalization."
- "We provide an end-to-end N-tier complaint intelligence blueprint."

Avoid these claims:
- "First ever complaint classifier"
- "State-of-the-art accuracy" (unless you provide benchmark evidence)
- "No one has done this before" (too risky without systematic review evidence)

## 12) Final One-Minute Novelty Pitch

"Complaint classification is a known problem, and we acknowledge prior ML, DL, and LLM literature. Our contribution is to extend this line of work into an operational complaint-intelligence system. We combine deterministic classification, severity-aware policy routing, explainable GenAI summaries, and response workflow orchestration in one secure N-tier architecture. Instead of stopping at category prediction, our system converts predictions into accountable business actions with persisted lifecycle states and role-based control. So the novelty is system-level integration and deployable actionability, not claiming a new core classifier algorithm."
