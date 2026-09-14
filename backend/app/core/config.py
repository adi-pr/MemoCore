from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RAG Backend"
    debug: bool = False

    supabase_url: str
    supabase_key: str

    ollama_host: str
    lmstudio_host: str

    embedding_model: str = "nomic-embed-text"
    llm_model: str = "gpt-4.1-mini"

    chunk_size: int = 1000
    chunk_overlap: int = 200

    retrieval_top_k: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()
