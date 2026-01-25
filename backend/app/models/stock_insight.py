"""
주식 AI 딥리서치 분석 결과 모델
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.sql import func
from app.core.database import Base


class StockInsight(Base):
    """주식 AI 딥리서치 분석 결과"""
    __tablename__ = "stock_insights"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # 종목 정보
    stock_code = Column(String(20), nullable=False, index=True)  # AAPL, 005930.KS
    stock_name = Column(String(100), nullable=False)  # Apple Inc., 삼성전자
    market = Column(String(10), nullable=False)  # US, KR

    # 투자 기간
    timeframe = Column(String(20), nullable=False)  # short, mid, long

    # 딥리서치 분석
    deep_research = Column(Text, nullable=False)

    # 투자 의사결정
    recommendation = Column(String(20), nullable=False)  # strong_buy, buy, hold, sell, strong_sell
    confidence_level = Column(String(20), nullable=False)  # low, medium, high
    recommendation_reason = Column(Text)

    # 위험도 평가
    risk_score = Column(Integer, nullable=False)  # 1-10
    risk_analysis = Column(JSON)  # volatility, company_specific, industry, macro, liquidity, regulatory

    # 시장 현황
    current_price = Column(Float)
    price_change_1d = Column(Float)
    price_change_1w = Column(Float)
    price_change_1m = Column(Float)
    market_overview = Column(JSON)  # price_movement, volume_trend, support_resistance, relative_performance

    # 시장 심리
    market_sentiment = Column(String(20))  # bullish, neutral, bearish
    sentiment_details = Column(JSON)  # overall, social_media, options_activity, insider_trading, institutional, short_interest

    # 분석 요약
    key_summary = Column(JSON)  # list of summary points
    current_drivers = Column(JSON)  # news_based, technical, fundamental

    # 미래 촉매
    future_catalysts = Column(JSON)  # short_term, mid_term, long_term

    # 메타데이터
    ai_model = Column(String(50))
    processing_time_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    def __repr__(self):
        return f"<StockInsight(id={self.id}, stock_code={self.stock_code}, recommendation={self.recommendation})>"
