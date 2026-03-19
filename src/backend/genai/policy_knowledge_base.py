"""
policy_knowledge_base.py — Sector-agnostic policy knowledge base.

Each entry maps a complaint category to a short policy guideline text.
This text is injected into the GenAI prompt to produce policy-grounded,
consistent responses rather than generic LLM output.

No ML training is required. To adapt this for a specific company or sector,
simply update the policy text for each category.
"""

# Policy guidelines keyed by complaint category.
# These match Config.COMPLAINT_CATEGORIES exactly.
POLICY_KB: dict[str, str] = {
    "Billing Issue": (
        "Billing Policy: Duplicate charges must be investigated and refunded within 5 business days. "
        "Incorrect invoices should be corrected and a revised bill issued within 48 hours. "
        "Unauthorized charges require an immediate temporary credit while investigation proceeds. "
        "The customer must receive a written confirmation of any billing correction made."
    ),
    "Delivery Problem": (
        "Delivery Policy: If a shipment is delayed beyond the committed date, the customer is entitled "
        "to a status update within 24 hours. Lost parcels must be investigated within 3 business days "
        "and a replacement or full refund offered within 7 days. Express delivery failures qualify for "
        "a shipping fee refund. The customer must be proactively notified of any delivery rescheduling."
    ),
    "Product Defect": (
        "Product Quality Policy: Defective products qualify for a free replacement or full refund within "
        "30 days of purchase. The customer is not required to pay return shipping for manufacturer defects. "
        "Products that are safety risks (overheating, sparking) must be flagged for urgent escalation. "
        "A replacement should be dispatched within 3-5 business days of defect confirmation."
    ),
    "Customer Support": (
        "Customer Service Policy: All support tickets must receive an initial response within 4 business hours. "
        "Escalations requested by the customer must be acknowledged within 24 hours. "
        "Rude or dismissive behavior by agents must be formally logged and a formal apology issued. "
        "No ticket should be closed without explicit customer confirmation that the issue is resolved."
    ),
    "Service Quality": (
        "Service Level Policy: Service outages lasting more than 4 hours entitle the customer to a "
        "proportional credit on their next bill. Repeated service interruptions (more than 3 in a month) "
        "qualify for a plan review or early contract exit without penalty. "
        "The customer must receive an estimated restoration time within 2 hours of reporting an outage."
    ),
    "Other": (
        "General Complaints Policy: All complaints, regardless of category, must be acknowledged within "
        "24 hours. Privacy-related concerns must be escalated to the data protection team immediately. "
        "Account-related issues must be resolved within 5 business days. "
        "The customer has the right to request a formal written response for any registered complaint."
    ),
}


def get_policy(category: str) -> str:
    """Return the policy guideline text for a given complaint category.

    Args:
        category: The predicted complaint category string. Must match one of
                  ``Config.COMPLAINT_CATEGORIES``. Falls back to the 'Other'
                  policy when the category is not found.

    Returns:
        Policy guideline text string to inject into GenAI prompts.
    """
    return POLICY_KB.get(category, POLICY_KB["Other"])
