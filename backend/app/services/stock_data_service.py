"""
주식 데이터 서비스
- 미국 주식: Finnhub API
- 한국 주식: yfinance (Yahoo Finance) + pykrx (종목 검색)
"""
import os
import logging
import urllib3
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import asyncio
from concurrent.futures import ThreadPoolExecutor

import httpx
import yfinance as yf
import pandas as pd

from app.core.config import settings
from app.services.kr_stock_cache import kr_stock_cache

# SSL 경고 비활성화
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

# Finnhub API 설정
FINNHUB_API_KEY = settings.FINNHUB_API
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

# 한국 주요 종목 코드 매핑 (yfinance 지원)
KR_STOCK_MAPPING = {
    # 시가총액 상위
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
    # IT/플랫폼
    "카카오뱅크": "323410.KS",
    "카카오페이": "377300.KS",
    "크래프톤": "259960.KS",
    "엔씨소프트": "036570.KS",
    "넷마블": "251270.KS",
    # 반도체/전자
    "삼성전기": "009150.KS",
    "DB하이텍": "000990.KS",
    "리노공업": "058470.KS",
    "원익IPS": "240810.KS",
    # 2차전지/소재
    "에코프로비엠": "247540.KS",
    "에코프로": "086520.KS",
    "포스코퓨처엠": "003670.KS",
    "엘앤에프": "066970.KS",
    # 바이오/헬스케어
    "삼성바이오에피스": "326030.KS",
    "유한양행": "000100.KS",
    "녹십자": "006280.KS",
    "한미약품": "128940.KS",
    # 금융
    "하나금융지주": "086790.KS",
    "우리금융지주": "316140.KS",
    "삼성생명": "032830.KS",
    "삼성화재": "000810.KS",
    "미래에셋증권": "006800.KS",
    # 자동차/부품
    "현대위아": "011210.KS",
    "만도": "204320.KS",
    "한온시스템": "018880.KS",
    # 에너지/유틸리티
    "한국전력": "015760.KS",
    "한국가스공사": "036460.KS",
    "SK이노베이션": "096770.KS",
    "S-Oil": "010950.KS",
    # 건설/인프라
    "삼성물산": "028260.KS",
    "현대건설": "000720.KS",
    "대우건설": "047040.KS",
    # 코스닥 대표
    "에코프로HN": "383310.KQ",
    "알테오젠": "196170.KQ",
    "HLB": "028300.KQ",
    "셀트리온제약": "068760.KQ",
    "펄어비스": "263750.KQ",
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
    """주식 데이터 서비스 (US: Finnhub, KR: yfinance)"""

    def __init__(self):
        self.cache: Dict[str, tuple] = {}  # symbol -> (data, timestamp)
        self.cache_ttl = 300  # 5분
        self._executor = ThreadPoolExecutor(max_workers=4)  # yfinance는 동기 API

    @property
    def api_key(self) -> str:
        """API 키를 settings에서 동적으로 가져옴"""
        return settings.FINNHUB_API

    async def resolve_stock_code(self, query: str) -> tuple[str, str]:
        """
        종목명/코드를 심볼로 변환 (pykrx 캐시 활용)

        Args:
            query: 종목명 또는 코드 (예: "애플", "AAPL", "005930.KS", "현대글로비스")

        Returns:
            (symbol, market) 튜플
        """
        query = query.strip()

        # 한국 종목 형식인 경우 (.KS, .KQ 접미사)
        if query.endswith(".KS") or query.endswith(".KQ"):
            return query, "KR"

        # 하드코딩된 한국 종목명 매핑 (빠른 조회용)
        if query in KR_STOCK_MAPPING:
            return KR_STOCK_MAPPING[query], "KR"

        # 하드코딩된 미국 종목명 매핑
        if query in US_STOCK_MAPPING:
            return US_STOCK_MAPPING[query], "US"

        # pykrx 캐시에서 한국 종목 검색 (이름 또는 코드)
        kr_result = await kr_stock_cache.resolve_code(query)
        if kr_result:
            return kr_result

        # 숫자로만 구성된 경우 한국 종목 코드로 판단
        if query.isdigit():
            code = query.zfill(6)
            # pykrx 캐시에서 시장 구분 조회 (KOSPI/KOSDAQ)
            market_type = await kr_stock_cache.get_market(code)
            suffix = ".KS" if market_type == "KOSPI" else ".KQ"
            return f"{code}{suffix}", "KR"

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

    def _fetch_yfinance_sync(self, symbol: str) -> Optional[Dict[str, Any]]:
        """yfinance 동기 호출 (ThreadPoolExecutor에서 실행)"""
        try:
            ticker = yf.Ticker(symbol)

            # 기본 정보 - 다양한 fallback 시도
            info = ticker.info or {}

            # 현재가 조회 (여러 필드 시도)
            current_price = (
                info.get("regularMarketPrice") or
                info.get("currentPrice") or
                info.get("previousClose") or
                info.get("open")
            )

            # 히스토리에서 현재가 시도
            if not current_price:
                try:
                    hist = ticker.history(period="5d")
                    if not hist.empty:
                        current_price = float(hist["Close"].iloc[-1])
                except Exception:
                    pass

            if not current_price:
                logger.warning(f"yfinance: 현재가를 찾을 수 없음 - {symbol}")
                return None

            # 히스토리 데이터로 변동률 계산
            try:
                hist = ticker.history(period="1mo")
            except Exception:
                hist = pd.DataFrame()

            price_change_1d_pct = None
            price_change_1w_pct = None
            price_change_1m_pct = None

            if not hist.empty and len(hist) > 1:
                try:
                    latest_close = float(hist["Close"].iloc[-1])

                    # 1일 변동
                    if len(hist) >= 2:
                        prev_close = float(hist["Close"].iloc[-2])
                        if prev_close > 0:
                            price_change_1d_pct = ((latest_close - prev_close) / prev_close) * 100

                    # 1주 변동 (5 거래일)
                    if len(hist) >= 6:
                        week_ago = float(hist["Close"].iloc[-6])
                        if week_ago > 0:
                            price_change_1w_pct = ((latest_close - week_ago) / week_ago) * 100

                    # 1개월 변동
                    if len(hist) >= 2:
                        month_ago = float(hist["Close"].iloc[0])
                        if month_ago > 0:
                            price_change_1m_pct = ((latest_close - month_ago) / month_ago) * 100
                except Exception as e:
                    logger.warning(f"yfinance: 가격 변동 계산 실패 - {symbol}: {e}")

            # 종목명 (한국 종목은 shortName이 없을 수 있음)
            name = (
                info.get("shortName") or
                info.get("longName") or
                info.get("displayName") or
                symbol.split(".")[0]  # .KS 제거
            )

            return {
                "current_price": current_price,
                "name": name,
                "currency": info.get("currency", "KRW"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE") or info.get("forwardPE"),
                "pb_ratio": info.get("priceToBook"),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                "beta": info.get("beta"),
                "sector": info.get("sector"),
                "industry": info.get("industry"),
                "price_change_1d_pct": price_change_1d_pct,
                "price_change_1w_pct": price_change_1w_pct,
                "price_change_1m_pct": price_change_1m_pct,
                "volume": info.get("volume") or info.get("regularMarketVolume"),
                "avg_volume": info.get("averageVolume") or info.get("averageDailyVolume10Day"),
            }
        except Exception as e:
            logger.error(f"yfinance 데이터 조회 실패 ({symbol}): {e}", exc_info=True)
            return None

    async def _get_kr_stock_data(self, symbol: str) -> Optional[StockData]:
        """한국 주식 데이터 조회 (yfinance)"""
        # 캐시 확인
        if symbol in self.cache:
            data, timestamp = self.cache[symbol]
            if datetime.now().timestamp() - timestamp < self.cache_ttl:
                logger.info(f"캐시된 데이터 사용 (KR): {symbol}")
                return data

        try:
            # yfinance는 동기 API이므로 ThreadPoolExecutor 사용
            loop = asyncio.get_running_loop()
            result = await loop.run_in_executor(
                self._executor,
                self._fetch_yfinance_sync,
                symbol
            )

            if not result:
                logger.warning(f"yfinance 데이터 없음: {symbol}")
                return None

            stock_data = StockData(
                symbol=symbol,
                name=result["name"],
                market="KR",
                current_price=result["current_price"],
                currency=result["currency"],
                price_change_1d=None,
                price_change_1d_pct=result.get("price_change_1d_pct"),
                price_change_1w=None,
                price_change_1w_pct=result.get("price_change_1w_pct"),
                price_change_1m=None,
                price_change_1m_pct=result.get("price_change_1m_pct"),
                price_change_ytd=None,
                volume=result.get("volume"),
                avg_volume=result.get("avg_volume"),
                market_cap=result.get("market_cap"),
                pe_ratio=result.get("pe_ratio"),
                pb_ratio=result.get("pb_ratio"),
                dividend_yield=None,
                fifty_two_week_high=result.get("fifty_two_week_high"),
                fifty_two_week_low=result.get("fifty_two_week_low"),
                rsi_14=None,
                ma_50=None,
                ma_200=None,
                beta=result.get("beta"),
                sector=result.get("sector"),
                industry=result.get("industry"),
            )

            # 캐시 저장
            self.cache[symbol] = (stock_data, datetime.now().timestamp())
            logger.info(f"yfinance 데이터 조회 성공: {symbol} - {result['currency']} {result['current_price']:,.0f}")
            return stock_data

        except Exception as e:
            logger.error(f"한국 주식 데이터 조회 실패 ({symbol}): {e}")
            return None

    async def get_stock_data(self, symbol: str) -> Optional[StockData]:
        """
        종목 데이터 조회 (Finnhub API)

        Args:
            symbol: 종목 심볼 (예: "AAPL", "MSFT")

        Returns:
            StockData 또는 None
        """
        # 심볼 정규화 및 마켓 판별 (async)
        resolved_symbol, market = await self.resolve_stock_code(symbol)

        # 한국 주식은 yfinance 사용
        if market == "KR":
            logger.info(f"한국 주식 데이터 조회 (yfinance): {resolved_symbol}")
            return await self._get_kr_stock_data(resolved_symbol)

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
        종목 검색 (pykrx 캐시 + Finnhub API)

        Args:
            query: 검색어

        Returns:
            검색 결과 리스트
        """
        results = []

        # 1. pykrx 캐시에서 한국 종목 검색 (전체 KOSPI/KOSDAQ)
        try:
            kr_results = await kr_stock_cache.search(query, limit=10)
            results.extend(kr_results)
            logger.debug(f"pykrx 캐시 검색 결과: {len(kr_results)}개")
        except Exception as e:
            logger.warning(f"pykrx 캐시 검색 실패: {e}")
            # 폴백: 하드코딩된 매핑에서 검색
            for name, code in KR_STOCK_MAPPING.items():
                if query.lower() in name.lower():
                    results.append({
                        "symbol": code,
                        "name": name,
                        "market": "KR",
                    })

        # 2. 하드코딩된 미국 종목 매핑에서 검색 (한글 검색 지원)
        for name, code in US_STOCK_MAPPING.items():
            if query.lower() in name.lower() or query.upper() == code:
                results.append({
                    "symbol": code,
                    "name": name,
                    "market": "US",
                })

        # 3. Finnhub Symbol Search API 사용 (미국 주식 추가 검색)
        if len([r for r in results if r["market"] == "US"]) < 5:
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
