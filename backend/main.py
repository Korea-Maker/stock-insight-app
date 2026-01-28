"""
Stock Deep Research API - FastAPI 백엔드 진입점
주식 AI 딥리서치 분석 앱
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db, close_db
from app.routers import analysis, payment

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    애플리케이션 생명주기 관리자 (시작/종료 이벤트 처리)
    - 시작 시: DB 초기화
    - 종료 시: 모든 리소스 정리
    """
    # 시작 시 실행할 코드
    logger.info("Stock Deep Research API 시작 중...")

    # 데이터베이스 초기화 (테이블 생성)
    await init_db()
    logger.info("데이터베이스 초기화 완료")

    yield

    # 종료 시 실행할 코드
    logger.info("Stock Deep Research API 종료 중...")

    # 데이터베이스 연결 종료
    await close_db()

    logger.info("Stock Deep Research API 종료 완료")


app = FastAPI(
    title="Stock Deep Research API",
    description="AI 기반 주식 딥리서치 분석 API (한국/미국 주식 지원)",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(analysis.router)
app.include_router(payment.router)


@app.get("/health")
async def health_check():
    """헬스 체크 엔드포인트"""
    return {"status": "healthy", "service": "Stock Deep Research API"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.ENVIRONMENT == "development",
    )
