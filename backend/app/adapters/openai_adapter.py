from typing import AsyncIterator

import openai


class OpenAIAdapter:
    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o",
        model_id: str = "gpt-4o",
        base_url: str | None = None,
        provider: str = "openai",
    ):
        self.model_id = model_id
        self.provider = provider
        self._model = model
        self._client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)

    async def generate(self, messages: list[dict[str, str]]) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,  # type: ignore[arg-type]
                max_tokens=4096,
            )
            return response.choices[0].message.content or ""
        except openai.APIError as e:
            raise RuntimeError(f"OpenAI API error for {self.model_id}: {e}") from e

    async def stream(self, messages: list[dict[str, str]]) -> AsyncIterator[str]:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,  # type: ignore[arg-type]
                max_tokens=4096,
                stream=True,
            )
            async for chunk in response:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except openai.APIError as e:
            raise RuntimeError(f"OpenAI API error for {self.model_id}: {e}") from e
