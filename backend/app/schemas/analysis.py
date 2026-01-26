"""
주식 분석 관련 Pydantic 스키마
AI 생성 주식 딥리서치 분석 데이터의 요청/응답 모델
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Dict
from enum import Enum


class TradingRecommendation(str, Enum):
    """투자 의사결정"""
    STRONG_BUY = "strong_buy"      # 적극매입
    BUY = "buy"                    # 매입
    HOLD = "hold"                  # 홀드
    SELL = "sell"                  # 매도
    STRONG_SELL = "strong_sell"   # 적극매도


class ConfidenceLevel(str, Enum):
    """신뢰도"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class MarketSentiment(str, Enum):
    """시장 심리"""
    BULLISH = "bullish"
    NEUTRAL = "neutral"
    BEARISH = "bearish"


class InvestmentTimeframe(str, Enum):
    """투자 기간"""
    SHORT = "short"   # 단기 (1-3개월)
    MID = "mid"       # 중기 (3-12개월)
    LONG = "long"     # 장기 (1년+)


# Request Schemas
class StockAnalysisRequest(BaseModel):
    """주식 분석 요청"""
    stock_code: str = Field(..., description="종목코드 또는 회사명 (예: AAPL, 삼성전자, 005930.KS)")
    timeframe: InvestmentTimeframe = Field(..., description="투자 기간 (short, mid, long)")
    checkout_id: Optional[str] = Field(None, description="결제 체크아웃 ID (결제 검증용)")


# Response Sub-Schemas
class RiskAnalysis(BaseModel):
    """위험도 분석"""
    volatility: Optional[str] = None          # 변동성
    company_specific: Optional[str] = None    # 회사 고유 리스크
    industry: Optional[str] = None            # 산업 리스크
    macro: Optional[str] = None               # 거시경제 리스크
    liquidity: Optional[str] = None           # 유동성 리스크
    regulatory: Optional[str] = None          # 규제 리스크


class MarketOverview(BaseModel):
    """시장 현황"""
    current_price: Optional[float] = None
    price_movement: Optional[str] = None      # 가격 움직임
    volume_trend: Optional[str] = None        # 거래량 추세
    support_resistance: Optional[str] = None  # 지지/저항선
    relative_performance: Optional[str] = None # 상대 성과


class SentimentDetails(BaseModel):
    """시장 심리 상세"""
    overall: Optional[str] = None             # 종합 심리
    social_media: Optional[str] = None        # 소셜미디어 심리
    options_activity: Optional[str] = None    # 옵션 활동
    insider_trading: Optional[str] = None     # 내부자 거래
    institutional: Optional[str] = None       # 기관 투자자
    short_interest: Optional[str] = None      # 공매도 비율


class CurrentDrivers(BaseModel):
    """현재 변동 요인"""
    news_based: Optional[str] = None          # 뉴스 기반
    technical: Optional[str] = None           # 기술적 요인
    fundamental: Optional[str] = None         # 펀더멘털 요인


class FutureCatalysts(BaseModel):
    """미래 촉매"""
    short_term: Optional[str] = None          # 단기 촉매
    mid_term: Optional[str] = None            # 중기 촉매
    long_term: Optional[str] = None           # 장기 촉매


# Main Response Schema
class StockInsightResponse(BaseModel):
    """주식 딥리서치 분석 응답"""
    id: int
    stock_code: str
    stock_name: str
    market: str  # US, KR
    timeframe: InvestmentTimeframe
    created_at: datetime

    # 딥리서치 분석
    deep_research: str

    # 투자 의사결정
    recommendation: TradingRecommendation
    confidence_level: ConfidenceLevel
    recommendation_reason: Optional[str] = None

    # 위험도 평가
    risk_score: int = Field(..., ge=1, le=10)
    risk_analysis: Optional[RiskAnalysis] = None

    # 시장 현황
    current_price: Optional[float] = None
    price_change_1d: Optional[float] = None
    price_change_1w: Optional[float] = None
    price_change_1m: Optional[float] = None
    market_overview: Optional[MarketOverview] = None

    # 시장 심리
    market_sentiment: Optional[MarketSentiment] = None
    sentiment_details: Optional[SentimentDetails] = None

    # 분석 요약
    key_summary: Optional[List[str]] = None
    current_drivers: Optional[CurrentDrivers] = None

    # 미래 촉매
    future_catalysts: Optional[FutureCatalysts] = None

    # 메타데이터
    ai_model: Optional[str] = None
    processing_time_ms: Optional[int] = None

    class Config:
        from_attributes = True


class StockInsightSummary(BaseModel):
    """분석 요약 (목록용)"""
    id: int
    stock_code: str
    stock_name: str
    market: str
    timeframe: InvestmentTimeframe
    recommendation: TradingRecommendation
    risk_score: int
    current_price: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class StockInsightListResponse(BaseModel):
    """주식 분석 목록 응답"""
    total: int
    items: List[StockInsightSummary]


class AnalysisTriggerResponse(BaseModel):
    """분석 트리거 응답"""
    message: str
    insight_id: int
    stock_code: str
    stock_name: str
    recommendation: str
