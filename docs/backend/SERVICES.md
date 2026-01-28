# Backend Services

Stock Insight App 백엔드 서비스 계층 문서입니다.

## 개요

서비스 계층은 비즈니스 로직을 담당하며, 라우터와 데이터 계층 사이에서 동작합니다.

```
frontend/components/
├── services/
│   ├── stock_insight_engine.py  # AI 분석 엔진
│   ├── stock_data_service.py    # 주식 데이터 수집
│   ├── payment_service.py       # Polar 결제 연동
│   ├── prompts.py               # LLM 프롬프트 정의
│   └── response_parser.py       # LLM 응답 파싱
```

---

## StockInsightEngine

**위치:** `app/services/stock_insight_engine.py`

AI를 사용하여 주식 딥리서치 분석을 생성하는 핵심 엔진입니다.

### 클래스 구조

```python
class StockInsightEngine:
    def __init__(self):
        # OpenAI 클라이언트 초기화
        self.openai_client: AsyncOpenAI
        self.openai_model: str = 'gpt-4o-mini'

        # Anthropic 클라이언트 초기화 (폴백)
        self.anthropic_client: AsyncAnthropic
        self.anthropic_model: str = 'claude-3-5-sonnet-20241022'

        # Primary provider
        self.primary_provider: str = 'openai'
```

### 주요 메서드

#### generate_insight

주식 딥리서치 분석을 생성합니다.

```python
async def generate_insight(
    self,
    stock_code: str,
    timeframe: str = "mid"
) -> Optional[StockInsight]:
    """
    Args:
        stock_code: 종목코드 또는 회사명 (예: "AAPL", "삼성전자")
        timeframe: 투자 기간 (short, mid, long)

    Returns:
        StockInsight 객체 또는 None
    """
```

**처리 흐름:**

1. 주식 데이터 수집 (StockDataService)
2. LLM 프롬프트 생성
3. LLM API 호출 (OpenAI → Anthropic 폴백)
4. 응답 파싱 (ResponseParser)
5. StockInsight 객체 생성
6. 데이터베이스 저장
7. 결과 반환

#### _call_llm

LLM API를 호출합니다. 자동 폴백을 지원합니다.

```python
async def _call_llm(
    self,
    system_prompt: str,
    user_prompt: str
) -> tuple[str, str]:
    """
    Returns:
        (응답 텍스트, 사용된 모델명) 튜플
    """
```

**폴백 로직:**
- Primary provider (OpenAI) 실패 시 Anthropic으로 자동 전환
- Anthropic 실패 시 OpenAI로 자동 전환

### 싱글톤 인스턴스

```python
stock_insight_engine = StockInsightEngine()
```

---

## StockDataService

**위치:** `app/services/stock_data_service.py`

주식 데이터를 수집하는 서비스입니다.

### 데이터 소스

| 시장 | 데이터 소스 | 방식 |
|------|-------------|------|
| US | Finnhub API | REST API |
| KR | yfinance | Yahoo Finance |

### 클래스 구조

```python
class StockDataService:
    def __init__(self):
        self.cache: Dict[str, tuple] = {}  # symbol -> (data, timestamp)
        self.cache_ttl = 300  # 5분
        self._executor = ThreadPoolExecutor(max_workers=4)
```

### 주요 메서드

#### resolve_stock_code

입력된 종목명/코드를 심볼로 변환합니다.

```python
def resolve_stock_code(self, query: str) -> tuple[str, str]:
    """
    Args:
        query: 종목명 또는 코드 (예: "애플", "AAPL", "005930.KS")

    Returns:
        (symbol, market) 튜플
    """
```

**변환 규칙:**
- `.KS`, `.KQ` 접미사 → 한국 종목
- 한국 종목명 (삼성전자) → KR_STOCK_MAPPING 조회
- 미국 종목명 (애플) → US_STOCK_MAPPING 조회
- 6자리 숫자 → 한국 코스피 (예: 005930 → 005930.KS)
- 영문 대문자 → 미국 종목

#### get_stock_data

종목 데이터를 조회합니다.

```python
async def get_stock_data(self, symbol: str) -> Optional[StockData]:
    """
    Args:
        symbol: 종목 심볼

    Returns:
        StockData 객체 또는 None
    """
```

#### search_stock

종목을 검색합니다.

```python
async def search_stock(self, query: str) -> List[Dict[str, Any]]:
    """
    Args:
        query: 검색어

    Returns:
        검색 결과 리스트
    """
```

### StockData 데이터클래스

```python
@dataclass
class StockData:
    symbol: str
    name: str
    market: str  # US, KR
    current_price: float
    currency: str
    price_change_1d: Optional[float]
    price_change_1d_pct: Optional[float]
    price_change_1w: Optional[float]
    price_change_1w_pct: Optional[float]
    price_change_1m: Optional[float]
    price_change_1m_pct: Optional[float]
    volume: Optional[int]
    avg_volume: Optional[int]
    market_cap: Optional[float]
    pe_ratio: Optional[float]
    pb_ratio: Optional[float]
    fifty_two_week_high: Optional[float]
    fifty_two_week_low: Optional[float]
    beta: Optional[float]
    sector: Optional[str]
    industry: Optional[str]
```

### 캐싱

- TTL: 5분 (300초)
- 캐시 키: symbol
- 메모리 캐시 사용

### 싱글톤 인스턴스

```python
stock_data_service = StockDataService()
```

---

## PaymentService

**위치:** `app/services/payment_service.py`

Polar 결제 연동 서비스입니다.

### 주요 메서드

#### is_configured

결제 서비스가 설정되었는지 확인합니다.

```python
def is_configured(self) -> bool:
    """Polar 환경변수가 설정되었는지 확인"""
```

#### create_checkout_session

결제 체크아웃 세션을 생성합니다.

```python
async def create_checkout_session(
    self,
    success_url: str,
    cancel_url: Optional[str] = None,
    metadata: Optional[Dict] = None
) -> Optional[CheckoutSession]:
```

#### verify_checkout_completed

결제 완료 여부를 검증합니다.

```python
async def verify_checkout_completed(self, checkout_id: str) -> bool:
```

#### refund_by_checkout_id

환불을 처리합니다.

```python
async def refund_by_checkout_id(
    self,
    checkout_id: str,
    reason: str,
    comment: str
) -> bool:
```

### 자동 환불

분석 실패 시 자동으로 환불이 처리됩니다:

- 종목을 찾을 수 없는 경우
- AI 분석 중 오류 발생
- 기타 예외 상황

---

## Prompts

**위치:** `app/services/prompts.py`

LLM 프롬프트를 정의합니다.

### STOCK_ANALYSIS_SYSTEM_PROMPT

시스템 프롬프트를 정의합니다. AI의 역할과 응답 형식을 지정합니다.

### get_stock_analysis_user_prompt

사용자 프롬프트를 생성합니다.

```python
def get_stock_analysis_user_prompt(
    stock_name: str,
    stock_code: str,
    market: str,
    timeframe: str,
    stock_data: dict
) -> str:
```

**프롬프트 구성:**
- 종목 정보 (이름, 코드, 시장)
- 투자 기간
- 현재 시장 데이터
- 분석 요청 지시문

---

## ResponseParser

**위치:** `app/services/response_parser.py`

LLM 응답을 파싱합니다.

### parse_stock_analysis_response

JSON 응답을 파싱하여 딕셔너리로 변환합니다.

```python
def parse_stock_analysis_response(response_text: str) -> dict:
    """
    Args:
        response_text: LLM JSON 응답

    Returns:
        파싱된 분석 결과 딕셔너리
    """
```

**파싱 항목:**
- deep_research (딥리서치 분석)
- recommendation (투자 의사결정)
- confidence_level (신뢰도)
- recommendation_reason (추천 이유)
- risk_score (위험도 점수)
- risk_analysis (위험 분석)
- market_overview (시장 현황)
- market_sentiment (시장 심리)
- sentiment_details (심리 상세)
- key_summary (핵심 요약)
- current_drivers (현재 변동 요인)
- future_catalysts (미래 촉매)

---

## KRStockCacheService

**위치:** `app/services/kr_stock_cache.py`

pykrx 기반 한국 종목 캐시 서비스입니다. KOSPI/KOSDAQ 전체 종목 목록을 캐싱하고, 종목코드와 종목명 간의 매핑을 제공합니다.

### 클래스 구조

```python
class KRStockCacheService:
    def __init__(self):
        # 종목 캐시: code -> (name, market)
        self._code_to_info: Dict[str, tuple[str, str]] = {}
        # 역방향 매핑: name -> code
        self._name_to_code: Dict[str, str] = {}
        # 캐시 TTL: 24시간
        self._cache_ttl = timedelta(hours=24)
```

### 주요 메서드

#### search

한국 종목을 검색합니다.

```python
async def search(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Args:
        query: 검색어 (종목명 또는 코드)
        limit: 최대 결과 수 (기본 10, 최대 100)

    Returns:
        검색 결과 리스트
        [{"symbol": "005930.KS", "name": "삼성전자", "market": "KR"}]
    """
```

**예시:**
```python
results = await kr_stock_cache.search("삼성")
# [
#   {"symbol": "005930.KS", "name": "삼성전자", "market": "KR"},
#   {"symbol": "006400.KS", "name": "삼성SDI", "market": "KR"},
#   ...
# ]
```

#### get_name

종목코드로 종목명을 조회합니다.

```python
async def get_name(self, code: str) -> Optional[str]:
    """
    Args:
        code: 종목코드 (예: "005930", "005930.KS")

    Returns:
        종목명 또는 None
    """
```

**예시:**
```python
name = await kr_stock_cache.get_name("005930")
# "삼성전자"
```

#### resolve_code

종목명/코드를 정규화된 심볼과 시장으로 변환합니다.

```python
async def resolve_code(self, query: str) -> Optional[tuple[str, str]]:
    """
    Args:
        query: 종목명 또는 코드 (예: "삼성전자", "005930", "005930.KS")

    Returns:
        (symbol, market) 튜플 또는 None
        예: ("005930.KS", "KR")
    """
```

**예시:**
```python
# 종목명으로 검색
result = await kr_stock_cache.resolve_code("삼성전자")
# ("005930.KS", "KR")

# 코드로 검색
result = await kr_stock_cache.resolve_code("005930")
# ("005930.KS", "KR")
```

#### is_kr_stock

주어진 쿼리가 한국 종목인지 확인합니다.

```python
async def is_kr_stock(self, query: str) -> bool:
    """
    Args:
        query: 종목명 또는 코드

    Returns:
        한국 종목이면 True
    """
```

### 캐싱 전략

- **TTL:** 24시간 (한국 시장은 일일 업데이트)
- **지연 로딩:** 첫 요청 시 pykrx에서 전체 종목 로드
- **스레드 안전:** asyncio.Lock 및 threading.Lock 사용
- **데이터 소스:** pykrx 라이브러리 (KOSPI/KOSDAQ)

### 심볼 접미사 규칙

| 시장 | 접미사 | 예시 |
|------|--------|------|
| KOSPI | `.KS` | `005930.KS` (삼성전자) |
| KOSDAQ | `.KQ` | `035720.KQ` (카카오) |

### 싱글톤 인스턴스

```python
kr_stock_cache = KRStockCacheService()
```

### 사용 예시

```python
from app.services.kr_stock_cache import kr_stock_cache

# 종목 검색
results = await kr_stock_cache.search("카카오", limit=5)

# 한국 종목 여부 확인
is_kr = await kr_stock_cache.is_kr_stock("삼성전자")  # True
is_kr = await kr_stock_cache.is_kr_stock("AAPL")     # False

# 종목코드 정규화
symbol, market = await kr_stock_cache.resolve_code("삼성전자")
# symbol: "005930.KS", market: "KR"
```

---

## 서비스 의존성 다이어그램

```
┌─────────────────────────────────────────┐
│              Analysis Router            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          StockInsightEngine             │
│                                         │
│  ┌───────────────┐ ┌─────────────────┐  │
│  │StockDataService│ │   Prompts      │  │
│  └───────┬───────┘ └────────┬────────┘  │
│          │                  │           │
│    ┌─────┴─────┐            ▼           │
│    ▼           ▼   ┌─────────────────┐  │
│  ┌───────┐ ┌──────┐│  OpenAI API    │  │
│  │Finnhub│ │KRStock││  Anthropic API │  │
│  │  API  │ │ Cache ││                │  │
│  └───────┘ └──────┘└────────┬────────┘  │
│              │              │           │
│              ▼              ▼           │
│        ┌─────────┐ ┌─────────────────┐  │
│        │ yfinance│ │ ResponseParser  │  │
│        └─────────┘ └─────────────────┘  │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│              SQLite Database            │
└─────────────────────────────────────────┘
```
