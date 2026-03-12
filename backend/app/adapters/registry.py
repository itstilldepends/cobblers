from app.adapters.base import LLMAdapter
from app.adapters.claude import ClaudeAdapter
from app.adapters.deepseek import create_deepseek_adapter
from app.adapters.gemini import GeminiAdapter
from app.adapters.openai_adapter import OpenAIAdapter

# model_id -> (provider, default_model_name)
MODEL_REGISTRY: dict[str, tuple[str, str]] = {
    # Direct provider models
    "claude-opus": ("anthropic", "claude-opus-4-6"),
    "claude-sonnet": ("anthropic", "claude-sonnet-4-6"),
    "claude-haiku": ("anthropic", "claude-haiku-4-5"),
    "gpt-5.4": ("openai", "gpt-5.4"),
    "gpt-5.4-pro": ("openai", "gpt-5.4-pro"),
    "gpt-5-mini": ("openai", "gpt-5-mini"),
    "gemini-flash": ("google", "gemini-3-flash-preview"),
    "gemini-pro": ("google", "gemini-3.1-pro-preview"),
    "deepseek": ("deepseek", "deepseek-chat"),
    # OpenRouter — one key, all models
    "or/claude-opus": ("openrouter", "anthropic/claude-opus-4.6"),
    "or/claude-sonnet": ("openrouter", "anthropic/claude-sonnet-4.6"),
    "or/claude-haiku": ("openrouter", "anthropic/claude-haiku-4.5"),
    "or/gpt-5.4": ("openrouter", "openai/gpt-5.4"),
    "or/gpt-5-mini": ("openrouter", "openai/gpt-5-mini"),
    "or/gemini-flash": ("openrouter", "google/gemini-3-flash-preview"),
    "or/gemini-pro": ("openrouter", "google/gemini-3.1-pro-preview"),
    "or/deepseek": ("openrouter", "deepseek/deepseek-v3.2"),
    "or/llama-4": ("openrouter", "meta-llama/llama-4-maverick"),
    "or/mistral-large": ("openrouter", "mistralai/mistral-large"),
}

# Map provider names to the API key name expected
_PROVIDER_KEY_MAP: dict[str, str] = {
    "anthropic": "anthropic",
    "openai": "openai",
    "google": "gemini",
    "deepseek": "deepseek",
    "openrouter": "openrouter",
}


def create_adapter(model_id: str, api_keys: dict[str, str]) -> LLMAdapter:
    """Create an LLM adapter for the given model_id.

    Args:
        model_id: Short model identifier (e.g. "claude-sonnet").
        api_keys: Mapping of provider -> API key.

    Returns:
        An instantiated adapter.

    Raises:
        ValueError: If model_id is unknown or required API key is missing.
    """
    if model_id not in MODEL_REGISTRY:
        raise ValueError(f"Unknown model: {model_id}. Available: {list(MODEL_REGISTRY.keys())}")

    provider, default_model = MODEL_REGISTRY[model_id]
    key_name = _PROVIDER_KEY_MAP[provider]
    api_key = api_keys.get(key_name)

    if not api_key:
        raise ValueError(f"Missing API key for provider '{key_name}' (needed by {model_id})")

    if provider == "anthropic":
        return ClaudeAdapter(api_key=api_key, model=default_model, model_id=model_id)  # type: ignore[return-value]
    elif provider == "openai":
        return OpenAIAdapter(api_key=api_key, model=default_model, model_id=model_id)  # type: ignore[return-value]
    elif provider == "google":
        return GeminiAdapter(api_key=api_key, model=default_model, model_id=model_id)  # type: ignore[return-value]
    elif provider == "deepseek":
        return create_deepseek_adapter(api_key=api_key, model=default_model, model_id=model_id)  # type: ignore[return-value]
    elif provider == "openrouter":
        return OpenAIAdapter(api_key=api_key, model=default_model, model_id=model_id, base_url="https://openrouter.ai/api/v1", provider="openrouter")  # type: ignore[return-value]
    else:
        raise ValueError(f"No adapter implementation for provider: {provider}")


def list_available_models() -> list[dict]:
    """Return list of all registered models with their provider."""
    return [
        {"model_id": model_id, "provider": provider}
        for model_id, (provider, _) in MODEL_REGISTRY.items()
    ]
