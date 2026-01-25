"""
주식 딥리서치 분석 API 라우터
AI 생성 주식 분석 결과를 조회하고 생성하는 엔드포인트 제공
"""
import logging
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.stock_insight import StockInsight
from app.schemas.analysis import (
    StockAnalysisRequest,
    StockInsightResponse,
    StockInsightListResponse,
    StockInsightSummary,
    AnalysisTriggerResponse,
    InvestmentTimeframe,
    RiskAnalysis,
    MarketOverview,
    SentimentDetails,
    CurrentDrivers,
    FutureCatalysts,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["Stock Analysis"])


def _build_response(insight: StockInsight) -> StockInsightResponse:
    """StockInsight 모델을 응답 스키마로 변환"""
    return StockInsightResponse(
        id=insight.id,
        stock_code=insight.stock_code,
        stock_name=insight.stock_name,
        market=insight.market,
        timeframe=InvestmentTimeframe(insight.timeframe),
        created_at=insight.created_at,
        deep_research=insight.deep_research,
        recommendation=insight.recommendation,
        confidence_level=insight.confidence_level,
        recommendation_reason=insight.recommendation_reason,
        risk_score=insight.risk_score,
        risk_analysis=RiskAnalysis(**insight.risk_analysis) if insight.risk_analysis else None,
        current_price=insight.current_price,
        price_change_1d=insight.price_change_1d,
        price_change_1w=insight.price_change_1w,
        price_change_1m=insight.price_change_1m,
        market_overview=MarketOverview(**insight.market_overview) if insight.market_overview else None,
        market_sentiment=insight.market_sentiment,
        sentiment_details=SentimentDetails(**insight.sentiment_details) if insight.sentiment_details else None,
        key_summary=insight.key_summary,
        current_drivers=CurrentDrivers(**insight.current_drivers) if insight.current_drivers else None,
        future_catalysts=FutureCatalysts(**insight.future_catalysts) if insight.future_catalysts else None,
        ai_model=insight.ai_model,
        processing_time_ms=insight.processing_time_ms,
    )


def _build_summary(insight: StockInsight) -> StockInsightSummary:
    """StockInsight 모델을 요약 스키마로 변환"""
    return StockInsightSummary(
        id=insight.id,
        stock_code=insight.stock_code,
        stock_name=insight.stock_name,
        market=insight.market,
        timeframe=InvestmentTimeframe(insight.timeframe),
        recommendation=insight.recommendation,
        risk_score=insight.risk_score,
        current_price=insight.current_price,
        created_at=insight.created_at,
    )


@router.post("/stock", response_model=AnalysisTriggerResponse)
async def analyze_stock(
    request: StockAnalysisRequest = Body(...),
    db: AsyncSession = Depends(get_db),
):
    """
    주식 딥리서치 분석 실행

    - **stock_code**: 종목코드 또는 회사명 (예: AAPL, 삼성전자, 005930.KS)
    - **timeframe**: 투자 기간 (short, mid, long)

    AI 모델을 사용하여 주식 딥리서치 분석을 수행합니다.
    한국 주식과 미국 주식 모두 지원합니다.
    """
    try:
        from app.services.stock_insight_engine import stock_insight_engine

        insight = await stock_insight_engine.generate_insight(
            stock_code=request.stock_code,
            timeframe=request.timeframe.value
        )

        if not insight:
            raise HTTPException(
                status_code=404,
                detail=f"종목 '{request.stock_code}'을(를) 찾을 수 없거나 분석에 실패했습니다"
            )

        logger.info(
            f"주식 분석 완료: {insight.stock_code} ({insight.stock_name}), "
            f"추천: {insight.recommendation}"
        )

        return AnalysisTriggerResponse(
            message="분석이 성공적으로 완료되었습니다",
            insight_id=insight.id,
            stock_code=insight.stock_code,
            stock_name=insight.stock_name,
            recommendation=insight.recommendation,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"주식 분석 실패: {request.stock_code} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"분석 중 오류가 발생했습니다: {str(e)}")


@router.get("/latest", response_model=StockInsightResponse)
async def get_latest_analysis(
    stock_code: str = Query(..., description="종목코드 (예: AAPL, 005930.KS)"),
    db: AsyncSession = Depends(get_db),
):
    """
    최신 주식 분석 조회

    - **stock_code**: 종목코드 (예: AAPL, 005930.KS)

    특정 종목에 대한 가장 최신 분석 결과 1개를 반환합니다.
    """
    try:
        query = (
            select(StockInsight)
            .where(StockInsight.stock_code == stock_code)
            .order_by(desc(StockInsight.created_at))
            .limit(1)
        )

        result = await db.execute(query)
        insight = result.scalar_one_or_none()

        if not insight:
            raise HTTPException(
                status_code=404,
                detail=f"종목 '{stock_code}'에 대한 분석 결과를 찾을 수 없습니다"
            )

        logger.info(f"최신 분석 조회 성공: {stock_code} (ID: {insight.id})")
        return _build_response(insight)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"최신 분석 조회 실패: {stock_code} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"분석 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/history", response_model=StockInsightListResponse)
async def get_analysis_history(
    stock_code: str = Query(None, description="종목코드 필터 (없으면 전체)"),
    limit: int = Query(20, ge=1, le=100, description="가져올 항목 수 (최대 100)"),
    skip: int = Query(0, ge=0, description="건너뛸 항목 수"),
    db: AsyncSession = Depends(get_db),
):
    """
    주식 분석 이력 조회

    - **stock_code**: 종목코드 필터 (선택적, 없으면 전체 이력)
    - **limit**: 가져올 항목 수 (기본값: 20, 최대 100)
    - **skip**: 페이지네이션을 위한 건너뛸 항목 수 (기본값: 0)

    분석 이력을 페이지네이션하여 반환합니다.
    """
    try:
        # 기본 쿼리
        base_query = select(StockInsight)
        count_query = select(func.count()).select_from(StockInsight)

        # 종목코드 필터 적용
        if stock_code:
            base_query = base_query.where(StockInsight.stock_code == stock_code)
            count_query = count_query.where(StockInsight.stock_code == stock_code)

        # 전체 개수 조회
        count_result = await db.execute(count_query)
        total = count_result.scalar() or 0

        # 분석 이력 조회
        query = (
            base_query
            .order_by(desc(StockInsight.created_at))
            .offset(skip)
            .limit(limit)
        )

        result = await db.execute(query)
        insights = result.scalars().all()

        items = [_build_summary(insight) for insight in insights]

        logger.info(f"분석 이력 조회 (total: {total}, skip: {skip}, limit: {limit})")

        return StockInsightListResponse(
            total=total,
            items=items,
        )

    except Exception as e:
        logger.error(f"분석 이력 조회 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"분석 이력 조회 중 오류가 발생했습니다: {str(e)}")


@router.get("/search/stock")
async def search_stock(
    query: str = Query(..., min_length=1, description="검색어 (종목명 또는 코드)"),
):
    """
    종목 검색

    - **query**: 검색어 (종목명 또는 코드)

    한국/미국 종목을 검색합니다.
    """
    try:
        from app.services.stock_data_service import stock_data_service

        results = await stock_data_service.search_stock(query)

        return {
            "query": query,
            "results": results,
        }

    except Exception as e:
        logger.error(f"종목 검색 실패: {query} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"종목 검색 중 오류가 발생했습니다: {str(e)}")


@router.get("/{insight_id}", response_model=StockInsightResponse)
async def get_analysis_by_id(
    insight_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    분석 ID로 조회

    - **insight_id**: 분석 ID

    특정 분석 결과를 ID로 조회합니다.
    """
    try:
        query = select(StockInsight).where(StockInsight.id == insight_id)
        result = await db.execute(query)
        insight = result.scalar_one_or_none()

        if not insight:
            raise HTTPException(
                status_code=404,
                detail=f"분석 ID {insight_id}를 찾을 수 없습니다"
            )

        return _build_response(insight)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"분석 조회 실패: ID {insight_id} - {str(e)}")
        raise HTTPException(status_code=500, detail=f"분석 조회 중 오류가 발생했습니다: {str(e)}")
