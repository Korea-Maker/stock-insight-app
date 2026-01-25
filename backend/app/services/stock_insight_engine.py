"""
주식 딥리서치 분석 엔진
OpenAI/Anthropic API를 사용하여 주식 분석을 생성합니다.
"""
import time
import logging
from typing import Optional
from dataclasses import asdict

from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.stock_insight import StockInsight
from app.services.stock_data_service import stock_data_service, StockData
from app.services.prompts import STOCK_ANALYSIS_SYSTEM_PROMPT, get_stock_analysis_user_prompt
from app.services.response_parser import parse_stock_analysis_response

logger = logging.getLogger(__name__)


class StockInsightEngine:
    """
    주식 딥리서치 분석 엔진
    OpenAI/Anthropic API를 사용하여 주식 데이터를 분석하고 인사이트를 생성합니다.
    """

    def __init__(self):
        """StockInsightEngine 초기화"""
        # OpenAI 클라이언트 초기화
        openai_key = getattr(settings, 'OPENAI_API_KEY', None)
        if openai_key:
            self.openai_client = AsyncOpenAI(api_key=openai_key)
            self.openai_model = getattr(settings, 'OPENAI_DEFAULT_MODEL', 'gpt-4o-mini')
        else:
            self.openai_client = None
            logger.warning("OPENAI_API_KEY가 설정되지 않았습니다.")

        # Anthropic 클라이언트 초기화
        anthropic_key = getattr(settings, 'ANTHROPIC_API_KEY', None)
        if anthropic_key:
            self.anthropic_client = AsyncAnthropic(api_key=anthropic_key)
            self.anthropic_model = getattr(settings, 'ANTHROPIC_DEFAULT_MODEL', 'claude-3-5-sonnet-20241022')
        else:
            self.anthropic_client = None
            logger.warning("ANTHROPIC_API_KEY가 설정되지 않았습니다.")

        # Primary provider 설정
        self.primary_provider = getattr(settings, 'LLM_PRIMARY_PROVIDER', 'openai')

    def _get_active_client(self):
        """활성화된 LLM 클라이언트 반환"""
        if self.primary_provider == 'anthropic' and self.anthropic_client:
            return ('anthropic', self.anthropic_client, self.anthropic_model)
        elif self.openai_client:
            return ('openai', self.openai_client, self.openai_model)
        elif self.anthropic_client:
            return ('anthropic', self.anthropic_client, self.anthropic_model)
        return (None, None, None)

    async def _call_openai_api(self, system_prompt: str, user_prompt: str) -> str:
        """OpenAI API 호출"""
        response = await self.openai_client.chat.completions.create(
            model=self.openai_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=4000,
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content

    async def _call_anthropic_api(self, system_prompt: str, user_prompt: str) -> str:
        """Anthropic API 호출"""
        response = await self.anthropic_client.messages.create(
            model=self.anthropic_model,
            max_tokens=4000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )
        return response.content[0].text

    async def _call_llm(self, system_prompt: str, user_prompt: str) -> tuple[str, str]:
        """
        LLM API 호출 (자동 폴백 지원)

        Returns:
            (응답 텍스트, 사용된 모델명) 튜플
        """
        provider, client, model = self._get_active_client()

        if not client:
            raise ValueError("사용 가능한 LLM 클라이언트가 없습니다. API 키를 확인하세요.")

        try:
            if provider == 'openai':
                response = await self._call_openai_api(system_prompt, user_prompt)
            else:
                response = await self._call_anthropic_api(system_prompt, user_prompt)
            return response, model

        except Exception as e:
            logger.error(f"{provider} API 호출 실패: {e}")

            # 폴백 시도
            if provider == 'openai' and self.anthropic_client:
                logger.info("Anthropic으로 폴백 시도...")
                response = await self._call_anthropic_api(system_prompt, user_prompt)
                return response, self.anthropic_model
            elif provider == 'anthropic' and self.openai_client:
                logger.info("OpenAI로 폴백 시도...")
                response = await self._call_openai_api(system_prompt, user_prompt)
                return response, self.openai_model

            raise

    async def _save_insight(self, insight: StockInsight) -> StockInsight:
        """분석 결과 저장"""
        async with AsyncSessionLocal() as db:
            db.add(insight)
            await db.commit()
            await db.refresh(insight)
            logger.info(f"주식 분석 저장 완료: ID={insight.id}")
            return insight

    async def generate_insight(
        self,
        stock_code: str,
        timeframe: str = "mid"
    ) -> Optional[StockInsight]:
        """
        주식 딥리서치 분석 생성

        Args:
            stock_code: 종목코드 또는 회사명 (예: "AAPL", "삼성전자", "005930.KS")
            timeframe: 투자 기간 (short, mid, long)

        Returns:
            StockInsight 객체 또는 None
        """
        start_time = time.time()

        try:
            logger.info(f"주식 분석 시작: {stock_code}, 기간: {timeframe}")

            # 1. 주식 데이터 수집
            stock_data = await stock_data_service.get_stock_data(stock_code)
            if not stock_data:
                logger.error(f"주식 데이터를 찾을 수 없음: {stock_code}")
                return None

            logger.info(f"주식 데이터 수집 완료: {stock_data.name} ({stock_data.symbol})")

            # 2. 프롬프트 생성
            stock_data_dict = asdict(stock_data)
            user_prompt = get_stock_analysis_user_prompt(
                stock_name=stock_data.name,
                stock_code=stock_data.symbol,
                market=stock_data.market,
                timeframe=timeframe,
                stock_data=stock_data_dict
            )

            # 3. LLM API 호출
            response_text, model_used = await self._call_llm(
                STOCK_ANALYSIS_SYSTEM_PROMPT,
                user_prompt
            )
            logger.info(f"LLM API 응답 수신 완료 (모델: {model_used})")

            # 4. 응답 파싱
            parsed_response = parse_stock_analysis_response(response_text)

            # 5. 처리 시간 계산
            processing_time_ms = int((time.time() - start_time) * 1000)

            # 6. StockInsight 객체 생성
            insight = StockInsight(
                stock_code=stock_data.symbol,
                stock_name=stock_data.name,
                market=stock_data.market,
                timeframe=timeframe,
                deep_research=parsed_response["deep_research"],
                recommendation=parsed_response["recommendation"],
                confidence_level=parsed_response["confidence_level"],
                recommendation_reason=parsed_response["recommendation_reason"],
                risk_score=parsed_response["risk_score"],
                risk_analysis=parsed_response["risk_analysis"],
                current_price=stock_data.current_price,
                price_change_1d=stock_data.price_change_1d,
                price_change_1w=stock_data.price_change_1w,
                price_change_1m=stock_data.price_change_1m,
                market_overview=parsed_response["market_overview"],
                market_sentiment=parsed_response["market_sentiment"],
                sentiment_details=parsed_response["sentiment_details"],
                key_summary=parsed_response["key_summary"],
                current_drivers=parsed_response["current_drivers"],
                future_catalysts=parsed_response["future_catalysts"],
                ai_model=model_used,
                processing_time_ms=processing_time_ms
            )

            # 7. 데이터베이스 저장
            insight = await self._save_insight(insight)

            logger.info(
                f"주식 분석 완료: {stock_data.symbol}, "
                f"추천={insight.recommendation}, "
                f"처리시간={processing_time_ms}ms"
            )

            return insight

        except Exception as e:
            logger.error(f"주식 분석 오류: {e}", exc_info=True)
            raise


# 싱글톤 인스턴스
stock_insight_engine = StockInsightEngine()
