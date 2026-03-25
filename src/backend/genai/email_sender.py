"""Email delivery service for complaint response workflows.

Supports two modes:
1. ``simulate``: logs the outgoing email and reports success for demos.
2. ``smtp``: sends a real email using SMTP credentials from environment variables.
"""

from __future__ import annotations

import logging
import smtplib
from email.message import EmailMessage

from config import Config

logger = logging.getLogger(__name__)


def send_response_email(recipient_email: str, subject: str, body: str) -> dict[str, str | bool]:
    """Deliver a complaint response email.

    Returns a small status dict used by the API layer and DB workflow updates.
    """
    delivery_mode = Config.EMAIL_DELIVERY_MODE

    if delivery_mode != "smtp":
        logger.info("Simulated email delivery to %s with subject %s", recipient_email, subject)
        return {
            "success": True,
            "delivery_mode": "simulate",
            "message": "Email delivery simulated successfully.",
        }

    if not Config.SMTP_HOST or not Config.SMTP_USERNAME or not Config.SMTP_PASSWORD:
        return {
            "success": False,
            "delivery_mode": "smtp",
            "message": "SMTP configuration is incomplete.",
        }

    message = EmailMessage()
    message["From"] = f"{Config.SMTP_FROM_NAME} <{Config.SMTP_FROM_EMAIL}>"
    message["To"] = recipient_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(Config.SMTP_HOST, Config.SMTP_PORT, timeout=20) as server:
            if Config.SMTP_USE_TLS:
                server.starttls()
            server.login(Config.SMTP_USERNAME, Config.SMTP_PASSWORD)
            server.send_message(message)
        logger.info("Email sent to %s", recipient_email)
        return {
            "success": True,
            "delivery_mode": "smtp",
            "message": "Email sent successfully.",
        }
    except Exception as exc:
        logger.error("Email delivery failed for %s: %s", recipient_email, exc)
        return {
            "success": False,
            "delivery_mode": "smtp",
            "message": "Email delivery failed.",
        }