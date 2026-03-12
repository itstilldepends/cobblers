from typing import AsyncIterator

import anthropic


class ClaudeAdapter:
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514", model_id: str = "claude-sonnet"):
        self.model_id = model_id
        self.provider = "anthropic"
        self._model = model
        self._client = anthropic.AsyncAnthropic(api_key=api_key)

    async def generate(self, messages: list[dict[str, str]]) -> str:
        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=4096,
                messages=messages,
            )
            return response.content[0].text
        except anthropic.APIError as e:
            raise RuntimeError(f"Anthropic API error for {self.model_id}: {e}") from e

    async def stream(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        try:
            async with self._client.messages.stream(
                model=self._model,
                max_tokens=4096,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    yield text
        except anthropic.APIError as e:
            raise RuntimeError(f"Anthropic API error for {self.model_id}: {e}") from e
