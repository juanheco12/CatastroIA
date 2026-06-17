from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    anthropic_api_key: str = ""
    google_api_key: str = ""      # Gemini Flash — gratis en aistudio.google.com
    groq_api_key: str = ""        # Groq Llama3  — gratis en console.groq.com
    database_url: str = "sqlite:///./catia.db"
    environment: str = "development"
    exports_path: str = "./exports"
    # Comma-separated list of allowed frontend origins (e.g. tu app en Vercel)
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

# Ensure required directories exist on startup
Path(settings.exports_path).mkdir(parents=True, exist_ok=True)
