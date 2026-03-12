from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    gemini_api_key: str | None = None
    deepseek_api_key: str | None = None
    data_dir: str = "./data"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
