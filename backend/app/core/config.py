"""
애플리케이션 설정
환경 변수 관리를 위해 Pydantic Settings 사용
"""
import os
from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List


class Settings(BaseSettings):
    """환경 변수에서 로드되는 애플리케이션 설정"""

    # API 설정
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    ENVIRONMENT: str = "development"

    # CORS 설정 (allow_credentials=True와 함께 사용 시 "*" 사용 불가)
    # 환경변수로 쉼표 구분 문자열 지원: CORS_ORIGINS=https://example.com,https://app.example.com
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """쉼표 구분 문자열을 리스트로 변환"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    # SQLite 경로 설정 (Koyeb 볼륨 마운트용)
    SQLITE_PATH: str = ""

    # 데이터베이스 설정
    POSTGRES_USER: str = "quantboard"
    POSTGRES_PASSWORD: str = "quantboard_dev"
    POSTGRES_DB: str = "quantboard"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432

    # OpenAI API 설정 (주식 분석용)
    OPENAI_API_KEY: str = ""
    OPENAI_DEFAULT_MODEL: str = "gpt-5-mini"

    # Anthropic API 설정 (주식 분석용)
    ANTHROPIC_API_KEY: str = ""
    ANTHROPIC_DEFAULT_MODEL: str = "claude-3-5-sonnet-20241022"

    # Google AI API 설정 (향후 지원)
    GOOGLE_AI_API_KEY: str = ""
    GOOGLE_DEFAULT_MODEL: str = "gemini-1.5-pro"

    # Azure OpenAI 설정 (향후 지원)
    AZURE_OPENAI_API_KEY: str = ""
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_DEPLOYMENT: str = ""

    # Finnhub API 설정 (주식 데이터)
    FINNHUB_API: str = ""

    # Polar 결제 설정
    POLAR_API_KEY: str = ""
    POLAR_BASE_URL: str = "https://sandbox-api.polar.sh/v1"
    POLAR_PRODUCT_ID: str = ""

    # LLM 파이프라인 설정
    LLM_PRIMARY_PROVIDER: str = "openai"  # openai, anthropic, google, azure_openai
    LLM_FALLBACK_ORDER: str = "openai,anthropic"  # 쉼표 구분 폴백 순서
    LLM_MAX_RETRIES: int = 3
    LLM_CIRCUIT_BREAKER_THRESHOLD: int = 3
    LLM_CIRCUIT_BREAKER_RECOVERY_MINUTES: int = 5

    # 주식 분석 설정
    ANALYSIS_MAX_HISTORY: int = 100  # 최대 분석 히스토리 개수
    ANALYSIS_CACHE_TTL: int = 3600  # 분석 캐시 TTL (초)

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # .env 파일의 추가 필드 무시


settings = Settings()
