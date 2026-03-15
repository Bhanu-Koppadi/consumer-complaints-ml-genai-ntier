# Note: In a real implementation, you would use Google Gemini or OpenAI API here.
# For this academic project version, if no API key is present, we might mock it
# or use a placeholder to ensure the app runs without external costs initially.

import logging

import google.generativeai as genai

from config import Config

logger = logging.getLogger(__name__)


class ExplanationGenerator:
    def __init__(self) -> None:
        self.api_key = Config.GEMINI_API_KEY
        self.model: genai.GenerativeModel | None = None
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(Config.GEMINI_MODEL)
        else:
            logger.warning("GEMINI_API_KEY not set. Explanation module will run in mock mode.")

    def generate(self, complaint_text: str, predicted_category: str) -> str:
        """
        Generate a human-readable explanation for the classification.
        """

        # Mock Response if no API key
        if self.model is None:
            return (
                f"The complaint was classified as '{predicted_category}' because the text contains keywords "
                "associated with this category. (GenAI Mock Explanation)"
            )

        try:
            # Structured Prompt
            prompt = f"""
            You are a helpful customer support AI assistant.
            A consumer complaint has been automatically classified.

            Complaint: "{complaint_text}"
            Predicted Category: "{predicted_category}"

            Task: Explain simply and clearly why this complaint belongs to this category.
            Keep the explanation concise (under 50 words).
            """

            response = self.model.generate_content(prompt)
            return response.text.strip()

        except Exception as e:
            logger.error("GenAI error: %s", e)
            return f"Could not generate explanation due to an error. Category: {predicted_category}."


# Singleton
explanation_service = ExplanationGenerator()


def generate_explanation(text: str, category: str) -> str:
    """Delegate to the singleton ExplanationGenerator."""
    return explanation_service.generate(text, category)
