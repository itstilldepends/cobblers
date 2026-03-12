from typing import AsyncIterator, Protocol


class LLMAdapter(Protocol):
    model_id: str
    provider: str

    async def generate(self, messages: list[dict[str, str]]) -> str: ...
    async def stream(self, messages: list[dict[str, str]]) -> AsyncIterator[str]: ...
