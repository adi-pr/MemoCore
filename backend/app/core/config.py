from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "RAG Backend"
    debug: bool = False

    supabase_url: str
    supabase_key: str

    model_timeout_seconds: float = 60.0
    
    ollama_host: str = "http://localhost:11434"
    lmstudio_host: str = "http://localhost:1234"

    embedding_provider: str = "ollama"
    embedding_model: str = "nomic-embed-text"
    embedding_dimension: int = 768

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
