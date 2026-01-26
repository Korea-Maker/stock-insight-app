"""
pykrx 기반 한국 종목 캐시 서비스

- KOSPI/KOSDAQ 전체 종목 목록 캐시
- 종목코드 ↔ 종목명 매핑
- 24시간 TTL 자동 갱신
"""
import logging
import asyncio
import threading
import ssl
import urllib3
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor

# SSL 경고 비활성화 (회사 네트워크 환경)
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

logger = logging.getLogger(__name__)

# 캐시 설정 상수
CACHE_TTL_HOURS = 24  # 한국 시장은 일일 업데이트
MAX_PYKRX_WORKERS = 2  # pykrx는 I/O 바운드, 동시성 제한
MAX_QUERY_LENGTH = 100  # 검색어 최대 길이
MAX_SEARCH_LIMIT = 100  # 검색 결과 최대 개수


class KRStockCacheService:
    """한국 주식 종목 캐시 서비스 (pykrx 기반)"""

    def __init__(self):
        # 종목 캐시: code -> (name, market)
        self._code_to_info: Dict[str, tuple[str, str]] = {}
        # 역방향 매핑: name -> code
        self._name_to_code: Dict[str, str] = {}
        # 캐시 타임스탬프
        self._cache_timestamp: Optional[datetime] = None
        # 캐시 TTL: 24시간
        self._cache_ttl = timedelta(hours=CACHE_TTL_HOURS)
        # 초기화 락 (lazy initialization to avoid event loop binding issues)
        self._init_lock: Optional[asyncio.Lock] = None
        # 데이터 접근 락 (thread safety)
        self._data_lock = threading.Lock()
        # ThreadPoolExecutor for sync pykrx calls
        self._executor = ThreadPoolExecutor(max_workers=MAX_PYKRX_WORKERS)
        # 초기화 완료 여부
        self._initialized = False

    def shutdown(self) -> None:
        """리소스 정리"""
        if self._executor:
            self._executor.shutdown(wait=False)
            logger.info("KRStockCacheService executor shutdown")

    def __del__(self):
        self.shutdown()

    def _is_cache_valid(self) -> bool:
        """캐시가 유효한지 확인"""
        if not self._cache_timestamp:
            return False
        return datetime.now() - self._cache_timestamp < self._cache_ttl

    def _load_stocks_sync(self) -> Dict[str, tuple[str, str]]:
        """pykrx에서 전체 종목 목록 로드 (동기)"""
        try:
            # SSL 검증 비활성화 (회사 네트워크 환경)
            import requests
            from requests.adapters import HTTPAdapter
            from urllib3.util.ssl_ import create_urllib3_context

            # 기본 SSL 컨텍스트 수정
            old_merge_environment_settings = requests.Session.merge_environment_settings

            def _merge_environment_settings(self, url, proxies, stream, verify, cert):
                settings = old_merge_environment_settings(self, url, proxies, stream, verify, cert)
                settings['verify'] = False
                return settings

            requests.Session.merge_environment_settings = _merge_environment_settings

            from pykrx import stock

            result: Dict[str, tuple[str, str]] = {}

            # KOSPI 종목 로드
            try:
                kospi_tickers = stock.get_market_ticker_list(market="KOSPI")
                for code in kospi_tickers:
                    try:
                        name = stock.get_market_ticker_name(code)
                        if name:
                            result[code] = (name, "KOSPI")
                    except Exception as e:
                        logger.debug(f"KOSPI 종목명 조회 실패: {code} - {e}")
                        continue
                logger.info(f"KOSPI 종목 로드 완료: {len([k for k, v in result.items() if v[1] == 'KOSPI'])}개")
            except Exception as e:
                logger.error(f"KOSPI 종목 목록 로드 실패: {e}")

            # KOSDAQ 종목 로드
            try:
                kosdaq_tickers = stock.get_market_ticker_list(market="KOSDAQ")
                for code in kosdaq_tickers:
                    try:
                        name = stock.get_market_ticker_name(code)
                        if name:
                            result[code] = (name, "KOSDAQ")
                    except Exception as e:
                        logger.debug(f"KOSDAQ 종목명 조회 실패: {code} - {e}")
                        continue
                logger.info(f"KOSDAQ 종목 로드 완료: {len([k for k, v in result.items() if v[1] == 'KOSDAQ'])}개")
            except Exception as e:
                logger.error(f"KOSDAQ 종목 목록 로드 실패: {e}")

            logger.info(f"전체 한국 종목 로드 완료: {len(result)}개")
            return result

        except ImportError:
            logger.error("pykrx 라이브러리가 설치되지 않았습니다. pip install pykrx")
            return {}
        except Exception as e:
            logger.error(f"pykrx 종목 로드 실패: {e}")
            return {}

    async def _ensure_initialized(self) -> None:
        """캐시 초기화 보장 (지연 로딩)"""
        if self._is_cache_valid():
            return

        # Lazy lock initialization to avoid event loop binding issues
        if self._init_lock is None:
            self._init_lock = asyncio.Lock()

        async with self._init_lock:
            # Double-check after acquiring lock
            if self._is_cache_valid():
                return

            logger.info("한국 종목 캐시 초기화 시작...")
            loop = asyncio.get_running_loop()

            try:
                stocks = await loop.run_in_executor(
                    self._executor,
                    self._load_stocks_sync
                )

                if stocks:
                    # Thread-safe assignment
                    with self._data_lock:
                        self._code_to_info = stocks
                        # 역방향 매핑 생성
                        self._name_to_code = {
                            info[0]: code for code, info in stocks.items()
                        }
                        self._cache_timestamp = datetime.now()
                        self._initialized = True
                    logger.info(f"한국 종목 캐시 초기화 완료: {len(stocks)}개 종목")
                else:
                    logger.warning("한국 종목 캐시 초기화 실패: 데이터 없음")

            except Exception as e:
                logger.error(f"한국 종목 캐시 초기화 실패: {e}")

    async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        한국 종목 검색

        Args:
            query: 검색어 (종목명 또는 코드)
            limit: 최대 결과 수

        Returns:
            검색 결과 리스트 [{"symbol": "005930.KS", "name": "삼성전자", "market": "KR"}]
        """
        # 입력 검증
        if not query or len(query) > MAX_QUERY_LENGTH:
            return []
        if limit < 1 or limit > MAX_SEARCH_LIMIT:
            limit = 10

        await self._ensure_initialized()

        results: List[Dict[str, Any]] = []
        query_lower = query.lower()
        query_upper = query.upper()

        # 코드로 직접 검색
        if query_upper in self._code_to_info:
            name, market = self._code_to_info[query_upper]
            suffix = ".KS" if market == "KOSPI" else ".KQ"
            results.append({
                "symbol": f"{query_upper}{suffix}",
                "name": name,
                "market": "KR",
            })

        # 이름으로 검색 (부분 일치)
        for code, (name, market) in self._code_to_info.items():
            if len(results) >= limit:
                break

            # 이미 코드로 추가된 경우 스킵
            if code == query_upper:
                continue

            # 이름에 검색어가 포함된 경우
            if query_lower in name.lower():
                suffix = ".KS" if market == "KOSPI" else ".KQ"
                results.append({
                    "symbol": f"{code}{suffix}",
                    "name": name,
                    "market": "KR",
                })

        return results[:limit]

    async def get_name(self, code: str) -> Optional[str]:
        """
        종목코드로 종목명 조회

        Args:
            code: 종목코드 (예: "005930", "005930.KS")

        Returns:
            종목명 또는 None
        """
        await self._ensure_initialized()

        # .KS, .KQ 접미사 제거
        clean_code = code.replace(".KS", "").replace(".KQ", "").strip()

        if clean_code in self._code_to_info:
            return self._code_to_info[clean_code][0]

        return None

    async def get_market(self, code: str) -> str:
        """
        종목코드로 시장 구분 조회

        Args:
            code: 종목코드 (예: "005930", "005930.KS")

        Returns:
            "KOSPI", "KOSDAQ", 또는 "KOSPI" (기본값)
        """
        await self._ensure_initialized()

        # .KS, .KQ 접미사 제거
        clean_code = code.replace(".KS", "").replace(".KQ", "").strip()

        if clean_code in self._code_to_info:
            return self._code_to_info[clean_code][1]

        # 기본값: 코스피
        return "KOSPI"

    async def resolve_code(self, query: str) -> Optional[tuple[str, str]]:
        """
        종목명/코드를 정규화된 심볼과 시장으로 변환

        Args:
            query: 종목명 또는 코드 (예: "삼성전자", "005930", "005930.KS")

        Returns:
            (symbol, market) 튜플 또는 None
            예: ("005930.KS", "KR")
        """
        await self._ensure_initialized()

        query = query.strip()

        # 이미 .KS, .KQ 접미사가 있는 경우
        if query.endswith(".KS") or query.endswith(".KQ"):
            clean_code = query.replace(".KS", "").replace(".KQ", "")
            if clean_code in self._code_to_info:
                return query, "KR"
            return None

        # 숫자로만 구성된 경우 (종목코드)
        if query.isdigit():
            code = query.zfill(6)
            if code in self._code_to_info:
                market = self._code_to_info[code][1]
                suffix = ".KS" if market == "KOSPI" else ".KQ"
                return f"{code}{suffix}", "KR"
            return None

        # 종목명으로 검색
        if query in self._name_to_code:
            code = self._name_to_code[query]
            market = self._code_to_info[code][1]
            suffix = ".KS" if market == "KOSPI" else ".KQ"
            return f"{code}{suffix}", "KR"

        return None

    async def is_kr_stock(self, query: str) -> bool:
        """
        주어진 쿼리가 한국 종목인지 확인

        Args:
            query: 종목명 또는 코드

        Returns:
            한국 종목이면 True
        """
        result = await self.resolve_code(query)
        return result is not None

    @property
    def stock_count(self) -> int:
        """캐시된 종목 수"""
        return len(self._code_to_info)

    @property
    def is_initialized(self) -> bool:
        """초기화 완료 여부"""
        return self._initialized and self._is_cache_valid()

    @property
    def is_healthy(self) -> bool:
        """캐시가 정상적으로 초기화되었는지 확인"""
        return self._initialized and len(self._code_to_info) > 0


# 싱글톤 인스턴스
kr_stock_cache = KRStockCacheService()
