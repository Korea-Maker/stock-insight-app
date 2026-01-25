"""
Finnhub 기반 주식 데이터 서비스
미국 주식 데이터 조회 (SSL 검증 비활성화)
"""
import os
import logging
import urllib3
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime

import httpx

from app.core.config import settings

# SSL 경고 비활성화
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

# Finnhub API 설정
FINNHUB_API_KEY = settings.FINNHUB_API
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

# 한국 주요 종목 코드 매핑 (Finnhub은 미국 주식만 지원하므로 참고용)
KR_STOCK_MAPPING = {
    "삼성전자": "005930.KS",
    "SK하이닉스": "000660.KS",
    "LG에너지솔루션": "373220.KS",
    "삼성바이오로직스": "207940.KS",
    "현대차": "005380.KS",
    "기아": "000270.KS",
    "셀트리온": "068270.KS",
    "KB금융": "105560.KS",
    "신한지주": "055550.KS",
    "POSCO홀딩스": "005490.KS",
    "네이버": "035420.KS",
    "카카오": "035720.KS",
    "LG화학": "051910.KS",
    "삼성SDI": "006400.KS",
    "현대모비스": "012330.KS",
}

# 미국 주요 종목 (검색 편의용)
US_STOCK_MAPPING = {
    "애플": "AAPL",
    "마이크로소프트": "MSFT",
    "구글": "GOOGL",
    "아마존": "AMZN",
    "테슬라": "TSLA",
    "엔비디아": "NVDA",
    "메타": "META",
    "넷플릭스": "NFLX",
    "버크셔해서웨이": "BRK-B",
}


@dataclass
class StockData:
    """주식 데이터"""
    symbol: str
    name: str
    market: str  # US, KR
    current_price: float
    currency: str
    price_change_1d: Optional[float] = None
    price_change_1d_pct: Optional[float] = None
    price_change_1w: Optional[float] = None
    price_change_1w_pct: Optional[float] = None
    price_change_1m: Optional[float] = None
    price_change_1m_pct: Optional[float] = None
    price_change_ytd: Optional[float] = None
    volume: Optional[int] = None
    avg_volume: Optional[int] = None
    market_cap: Optional[float] = None
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    dividend_yield: Optional[float] = None
    fifty_two_week_high: Optional[float] = None
    fifty_two_week_low: Optional[float] = None
    rsi_14: Optional[float] = None
    ma_50: Optional[float] = None
    ma_200: Optional[float] = None
    beta: Optional[float] = None
    sector: Optional[str] = None
    industry: Optional[str] = None


class StockDataService:
    """Finnhub 기반 주식 데이터 서비스"""

    def __init__(self):
        self.cache: Dict[str, tuple] = {}  # symbol -> (data, timestamp)
        self.cache_ttl = 300  # 5분

    @property
    def api_key(self) -> str:
        """API 키를 settings에서 동적으로 가져옴"""
        return settings.FINNHUB_API

    def resolve_stock_code(self, query: str) -> tuple[str, str]:
        """
        종목명/코드를 심볼로 변환

        Args:
            query: 종목명 또는 코드 (예: "애플", "AAPL", "005930.KS")

        Returns:
            (symbol, market) 튜플
        """
        query = query.strip()

        # 한국 종목 형식인 경우
        if query.endswith(".KS") or query.endswith(".KQ"):
            return query, "KR"

        # 한국 종목명 매핑
        if query in KR_STOCK_MAPPING:
            return KR_STOCK_MAPPING[query], "KR"

        # 미국 종목명 매핑
        if query in US_STOCK_MAPPING:
            return US_STOCK_MAPPING[query], "US"

        # 숫자로만 구성된 경우 한국 종목 코드로 판단
        if query.isdigit():
            return f"{query.zfill(6)}.KS", "KR"

        # 영문 대문자로만 구성된 경우 미국 종목으로 판단
        if query.isupper() and query.isalpha():
            return query, "US"

        # 기타: 그대로 반환 (미국 종목으로 가정)
        return query.upper(), "US"

    async def _fetch_finnhub(self, endpoint: str, params: Dict[str, Any]) -> Optional[Dict]:
        """Finnhub API 호출 (SSL 검증 비활성화)"""
        api_key = self.api_key
        if not api_key:
            logger.error("FINNHUB_API 키가 설정되지 않았습니다. .env 파일을 확인하세요.")
            return None
        params["token"] = api_key
        url = f"{FINNHUB_BASE_URL}/{endpoint}"

        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"Finnhub API HTTP 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"Finnhub API 호출 실패: {e}")
            return None

    async def get_stock_data(self, symbol: str) -> Optional[StockData]:
        """
        종목 데이터 조회 (Finnhub API)

        Args:
            symbol: 종목 심볼 (예: "AAPL", "MSFT")

        Returns:
            StockData 또는 None
        """
        # 심볼 정규화 및 마켓 판별
        resolved_symbol, market = self.resolve_stock_code(symbol)

        # 한국 주식은 Finnhub에서 지원하지 않음
        if market == "KR":
            logger.warning(f"Finnhub은 한국 주식을 지원하지 않습니다: {resolved_symbol}")
            return None

        # 캐시 확인
        if resolved_symbol in self.cache:
            data, timestamp = self.cache[resolved_symbol]
            if datetime.now().timestamp() - timestamp < self.cache_ttl:
                logger.info(f"캐시된 데이터 사용: {resolved_symbol}")
                return data

        try:
            # 1. Quote 데이터 조회 (현재가, 변동)
            quote = await self._fetch_finnhub("quote", {"symbol": resolved_symbol})
            if not quote or quote.get("c", 0) == 0:
                logger.warning(f"Quote 데이터 없음: {resolved_symbol}")
                return None

            current_price = quote.get("c", 0)  # Current price
            price_change_1d = quote.get("d", 0)  # Change
            price_change_1d_pct = quote.get("dp", 0)  # Percent change
            high = quote.get("h", 0)  # High price of the day
            low = quote.get("l", 0)  # Low price of the day
            open_price = quote.get("o", 0)  # Open price
            prev_close = quote.get("pc", 0)  # Previous close

            # 2. Company Profile 조회
            profile = await self._fetch_finnhub("stock/profile2", {"symbol": resolved_symbol})
            company_name = resolved_symbol
            market_cap = None
            industry = None

            if profile:
                company_name = profile.get("name", resolved_symbol)
                market_cap = profile.get("marketCapitalization", 0) * 1_000_000  # 백만 단위 -> 달러
                industry = profile.get("finnhubIndustry")

            # 3. Basic Financials 조회 (PE, PB, Beta, 52주 고/저)
            metrics = await self._fetch_finnhub("stock/metric", {"symbol": resolved_symbol, "metric": "all"})

            pe_ratio = None
            pb_ratio = None
            beta = None
            fifty_two_week_high = None
            fifty_two_week_low = None

            if metrics and "metric" in metrics:
                m = metrics["metric"]
                pe_ratio = m.get("peBasicExclExtraTTM")
                pb_ratio = m.get("pbAnnual")
                beta = m.get("beta")
                fifty_two_week_high = m.get("52WeekHigh")
                fifty_two_week_low = m.get("52WeekLow")

            stock_data = StockData(
                symbol=resolved_symbol,
                name=company_name,
                market=market,
                current_price=current_price,
                currency="USD",
                price_change_1d=price_change_1d,
                price_change_1d_pct=price_change_1d_pct,
                price_change_1w=None,  # Finnhub 무료 티어에서 미지원
                price_change_1w_pct=None,
                price_change_1m=None,
                price_change_1m_pct=None,
                price_change_ytd=None,
                volume=None,  # Quote에 포함 안 됨
                avg_volume=None,
                market_cap=market_cap,
                pe_ratio=pe_ratio,
                pb_ratio=pb_ratio,
                dividend_yield=None,
                fifty_two_week_high=fifty_two_week_high,
                fifty_two_week_low=fifty_two_week_low,
                rsi_14=None,
                ma_50=None,
                ma_200=None,
                beta=beta,
                sector=None,
                industry=industry,
            )

            # 캐시 저장
            self.cache[resolved_symbol] = (stock_data, datetime.now().timestamp())

            logger.info(f"Finnhub 데이터 조회 성공: {resolved_symbol} - ${current_price}")
            return stock_data

        except Exception as e:
            logger.error(f"주식 데이터 조회 실패 ({resolved_symbol}): {e}")
            return None

    async def search_stock(self, query: str) -> List[Dict[str, Any]]:
        """
        종목 검색

        Args:
            query: 검색어

        Returns:
            검색 결과 리스트
        """
        results = []

        # 한국 종목 매핑에서 검색
        for name, code in KR_STOCK_MAPPING.items():
            if query.lower() in name.lower():
                results.append({
                    "symbol": code,
                    "name": name,
                    "market": "KR",
                })

        # 미국 종목 매핑에서 검색
        for name, code in US_STOCK_MAPPING.items():
            if query.lower() in name.lower() or query.upper() == code:
                results.append({
                    "symbol": code,
                    "name": name,
                    "market": "US",
                })

        # Finnhub Symbol Search API 사용
        if len(results) < 5:
            search_result = await self._fetch_finnhub("search", {"q": query})
            if search_result and "result" in search_result:
                for item in search_result["result"][:10]:
                    symbol = item.get("symbol", "")
                    # 미국 주식만 필터링 (. 없는 심볼)
                    if symbol and "." not in symbol:
                        results.append({
                            "symbol": symbol,
                            "name": item.get("description", symbol),
                            "market": "US",
                        })

        # 중복 제거
        seen = set()
        unique_results = []
        for r in results:
            if r["symbol"] not in seen:
                seen.add(r["symbol"])
                unique_results.append(r)

        return unique_results[:10]  # 최대 10개


# 싱글톤 인스턴스
stock_data_service = StockDataService()
