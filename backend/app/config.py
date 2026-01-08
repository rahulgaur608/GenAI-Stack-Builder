"""
Configuration settings for the FastAPI backend.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional, Union, Any
import os


from pydantic import field_validator
import json

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App Settings
    app_name: str = "GenAI Stack Builder API"
    debug: bool = True
    
    # Database
    db_user: Optional[str] = None
    db_password: Optional[str] = None
    database_url: str = "postgresql://postgres:postgres@localhost:5432/genai_stacks"
    
    # ChromaDB
    chroma_persist_directory: str = "./chroma_db"
    
    # OpenRouter (Unified LLM Provider)
    openrouter_api_key: str = "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"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    
    # Deprecated fields (keeping slightly for backward compat during migration but ignoring)
    openai_api_key: Optional[str] = None
    google_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    anthropic_base_url: Optional[str] = None
    
    # SerpAPI
    serpapi_key: str = ""
    
    # File Upload
    upload_directory: str = "./uploads"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    
    # CORS
    cors_origins: list[str] = [
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3001",
        "http://127.0.0.1:3001"
    ]
    
    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        if isinstance(v, str):
            # Check for JSON list format
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    return json.loads(v)
                except:
                    pass
            # Fallback to comma-separated list
            return [x.strip() for x in v.split(",") if x.strip()]
        return v
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
