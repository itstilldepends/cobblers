from typing import AsyncIterator

from google import genai


class GeminiAdapter:
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash", model_id: str = "gemini-flash"):
        self.model_id = model_id
        self.provider = "google"
        self._model = model
        self._client = genai.Client(api_key=api_key)

    async def generate(self, messages: list[dict[str, str]]) -> str:
        try:
            contents = self._format_messages(messages)
            response = await self._client.aio.models.generate_content(
                model=self._model,
                contents=contents,
            )
            return response.text or ""
        except Exception as e:
            raise RuntimeError(f"Gemini API error for {self.model_id}: {e}") from e

    async def stream(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        try:
            contents = self._format_messages(messages)
            async for chunk in self._client.aio.models.generate_content_stream(
                model=self._model,
                contents=contents,
            ):
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            raise RuntimeError(f"Gemini API error for {self.model_id}: {e}") from e

    @staticmethod
    def _format_messages(messages: list[dict[str, str]]) -> str:
        """Convert chat messages to a single content string for Gemini."""
        parts = []
        for msg in messages:
            parts.append(msg["content"])
        return "\n\n".join(parts)
