from app.adapters.openai_adapter import OpenAIAdapter


def create_deepseek_adapter(api_key: str, model: str = "deepseek-chat", model_id: str = "deepseek") -> OpenAIAdapter:
    """Create a DeepSeek adapter using the OpenAI-compatible API."""
    return OpenAIAdapter(
        api_key=api_key,
        model=model,
        model_id=model_id,
        base_url="https://api.deepseek.com",
        provider="deepseek",
    )
