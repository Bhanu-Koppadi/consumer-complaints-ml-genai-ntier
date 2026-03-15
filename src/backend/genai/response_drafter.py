"""GenAI auto-response drafting module.

Uses Google Gemini to draft professional customer-service response emails
for submitted consumer complaints. Falls back to a structured mock draft
when no API key is configured.
"""

import logging

import google.generativeai as genai

from config import Config

logger = logging.getLogger(__name__)


class ResponseDrafter:
    """Drafts professional customer-service response emails using Google Gemini.

    When ``GEMINI_API_KEY`` is absent the instance operates in mock mode and
    returns a structured fallback draft without making any external calls.
    """

    def __init__(self) -> None:
        """Initialise the drafter; configure Gemini when API key is present."""
        self._api_key = Config.GEMINI_API_KEY
        if self._api_key:
            genai.configure(api_key=self._api_key)
            self._model = genai.GenerativeModel(Config.GEMINI_MODEL)
        else:
            self._model = None
            logger.warning("GEMINI_API_KEY not set. ResponseDrafter will run in mock mode.")

    def draft(
        self,
        complaint_text: str,
        predicted_category: str,
        confidence: float,
    ) -> str:
        """Draft a professional customer-service response for a complaint.

        Args:
            complaint_text: The original text of the consumer complaint.
            predicted_category: The ML-predicted complaint category.
            confidence: The classifier's confidence score (0.0 – 1.0).

        Returns:
            A draft response email string.
        """
        if self._model is None:
            return self._mock_draft(predicted_category)

        try:
            # Remove control characters to reduce prompt injection surface.
            safe_text = " ".join(complaint_text.split())
            safe_category = " ".join(predicted_category.split())

            prompt = f"""
            You are a professional customer-service representative.
            A consumer complaint has been received and automatically classified.

            Complaint: "{safe_text}"
            Category: "{safe_category}"
            Classifier Confidence: {confidence:.0%}

            Task: Write a concise, empathetic, and professional response email to
            the customer acknowledging their complaint and outlining next steps.
            Keep the response under 120 words.
            """

            response = self._model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.error("GenAI draft error: %s", e)
            return self._mock_draft(predicted_category)

    @staticmethod
    def _mock_draft(category: str) -> str:
        """Return a structured fallback draft when Gemini is unavailable.

        Args:
            category: The predicted complaint category.

        Returns:
            A non-empty mock draft string tailored to the category.
        """
        return (
            "Dear Valued Customer,\n\n"
            f"Thank you for contacting us regarding your {category} concern. "
            "We sincerely apologise for any inconvenience caused and want to "
            "assure you that your complaint has been received and is being "
            "reviewed by our team.\n\n"
            "A dedicated representative will follow up with you within 2 "
            "business days with a resolution or further information.\n\n"
            "We appreciate your patience and the opportunity to make this right.\n\n"
            "Kind regards,\n"
            "Customer Support Team"
        )


# Singleton instance
response_drafter_service = ResponseDrafter()


def draft_response(
    complaint_text: str,
    category: str,
    confidence: float,
) -> str:
    """Draft a professional response for a classified consumer complaint.

    Args:
        complaint_text: The original text of the consumer complaint.
        category: The ML-predicted complaint category.
        confidence: The classifier's confidence score (0.0 – 1.0).

    Returns:
        A draft response email string.
    """
    return response_drafter_service.draft(complaint_text, category, confidence)
