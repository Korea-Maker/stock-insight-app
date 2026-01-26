# Backend Models

Stock Insight App 데이터 모델 문서입니다.

## 개요

SQLAlchemy ORM을 사용하며, SQLite 데이터베이스에 저장됩니다.

**데이터베이스 파일:** `backend/stock_insights.db` (자동 생성)

---

## StockInsight

**위치:** `app/models/stock_insight.py`

주식 AI 딥리서치 분석 결과를 저장하는 모델입니다.

### 테이블 정의

```python
class StockInsight(Base):
    __tablename__ = "stock_insights"
```

### 필드 정의

#### 기본 정보

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| id | Integer | ✅ | Primary Key (auto) |
| stock_code | String(20) | ✅ | 종목코드 (AAPL, 005930.KS) |
| stock_name | String(100) | ✅ | 종목명 (Apple Inc., 삼성전자) |
| market | String(10) | ✅ | 시장 (US, KR) |
| timeframe | String(20) | ✅ | 투자 기간 (short, mid, long) |

#### 딥리서치 분석

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| deep_research | Text | ✅ | AI 딥리서치 분석 본문 |

#### 투자 의사결정

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| recommendation | String(20) | ✅ | 투자 의사결정 |
| confidence_level | String(20) | ✅ | 신뢰도 (low, medium, high) |
| recommendation_reason | Text | ❌ | 추천 이유 |

**recommendation 값:**
- `strong_buy`: 적극 매입
- `buy`: 매입
- `hold`: 홀드
- `sell`: 매도
- `strong_sell`: 적극 매도

#### 위험도 평가

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| risk_score | Integer | ✅ | 위험도 점수 (1-10) |
| risk_analysis | JSON | ❌ | 위험 분석 상세 |

**risk_analysis 구조:**
```json
{
  "volatility": "변동성 분석",
  "company_specific": "회사 고유 리스크",
  "industry": "산업 리스크",
  "macro": "거시경제 리스크",
  "liquidity": "유동성 리스크",
  "regulatory": "규제 리스크"
}
```

#### 시장 현황

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| current_price | Float | ❌ | 현재 가격 |
| price_change_1d | Float | ❌ | 1일 변동 (%) |
| price_change_1w | Float | ❌ | 1주 변동 (%) |
| price_change_1m | Float | ❌ | 1개월 변동 (%) |
| market_overview | JSON | ❌ | 시장 현황 상세 |

**market_overview 구조:**
```json
{
  "price_movement": "가격 움직임",
  "volume_trend": "거래량 추세",
  "support_resistance": "지지/저항선",
  "relative_performance": "상대 성과"
}
```

#### 시장 심리

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| market_sentiment | String(20) | ❌ | 시장 심리 |
| sentiment_details | JSON | ❌ | 심리 상세 |

**market_sentiment 값:**
- `bullish`: 강세
- `neutral`: 중립
- `bearish`: 약세

**sentiment_details 구조:**
```json
{
  "overall": "종합 심리",
  "social_media": "소셜미디어 심리",
  "options_activity": "옵션 활동",
  "insider_trading": "내부자 거래",
  "institutional": "기관 투자자",
  "short_interest": "공매도 비율"
}
```

#### 분석 요약

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| key_summary | JSON | ❌ | 핵심 요약 포인트 리스트 |
| current_drivers | JSON | ❌ | 현재 변동 요인 |

**current_drivers 구조:**
```json
{
  "news_based": "뉴스 기반 요인",
  "technical": "기술적 요인",
  "fundamental": "펀더멘털 요인"
}
```

#### 미래 촉매

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| future_catalysts | JSON | ❌ | 미래 촉매 |

**future_catalysts 구조:**
```json
{
  "short_term": "단기 촉매",
  "mid_term": "중기 촉매",
  "long_term": "장기 촉매"
}
```

#### 메타데이터

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| ai_model | String(50) | ❌ | 사용된 AI 모델 |
| processing_time_ms | Integer | ❌ | 처리 시간 (ms) |
| created_at | DateTime | ✅ | 생성 시간 (자동) |

### 인덱스

```sql
CREATE INDEX ix_stock_insights_stock_code ON stock_insights(stock_code);
```

### 예시 데이터

```json
{
  "id": 1,
  "stock_code": "AAPL",
  "stock_name": "Apple Inc.",
  "market": "US",
  "timeframe": "mid",
  "deep_research": "Apple Inc.는 현재 AI 기술 투자와 서비스 부문 성장...",
  "recommendation": "buy",
  "confidence_level": "high",
  "recommendation_reason": "강력한 서비스 매출 성장과 AI 전략",
  "risk_score": 4,
  "risk_analysis": {
    "volatility": "중간 수준의 변동성",
    "company_specific": "제품 주기 의존성",
    "industry": "기술 섹터 규제 위험",
    "macro": "금리 인상 영향",
    "liquidity": "높은 유동성",
    "regulatory": "반독점 조사 진행 중"
  },
  "current_price": 185.92,
  "price_change_1d": 2.34,
  "price_change_1w": -1.2,
  "price_change_1m": 5.6,
  "market_sentiment": "bullish",
  "key_summary": [
    "서비스 매출 사상 최고치 달성",
    "AI 기술 투자 확대",
    "iPhone 판매 안정적"
  ],
  "future_catalysts": {
    "short_term": "신제품 발표 (3월)",
    "mid_term": "AI 기능 탑재 iOS 업데이트",
    "long_term": "AR/VR 디바이스 확대"
  },
  "ai_model": "gpt-4o-mini",
  "processing_time_ms": 4523,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 스키마 (Pydantic)

**위치:** `app/schemas/analysis.py`

API 요청/응답 검증을 위한 Pydantic 모델입니다.

### Enums

```python
class TradingRecommendation(str, Enum):
    STRONG_BUY = "strong_buy"
    BUY = "buy"
    HOLD = "hold"
    SELL = "sell"
    STRONG_SELL = "strong_sell"

class ConfidenceLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class MarketSentiment(str, Enum):
    BULLISH = "bullish"
    NEUTRAL = "neutral"
    BEARISH = "bearish"

class InvestmentTimeframe(str, Enum):
    SHORT = "short"   # 1-3개월
    MID = "mid"       # 3-12개월
    LONG = "long"     # 1년+
```

### Request Models

#### StockAnalysisRequest

```python
class StockAnalysisRequest(BaseModel):
    stock_code: str
    timeframe: InvestmentTimeframe
    checkout_id: Optional[str] = None
```

### Response Models

#### StockInsightResponse

전체 분석 결과 응답 모델입니다.

#### StockInsightSummary

목록용 요약 모델입니다.

```python
class StockInsightSummary(BaseModel):
    id: int
    stock_code: str
    stock_name: str
    market: str
    timeframe: InvestmentTimeframe
    recommendation: TradingRecommendation
    risk_score: int
    current_price: Optional[float]
    created_at: datetime
```

#### StockInsightListResponse

```python
class StockInsightListResponse(BaseModel):
    total: int
    items: List[StockInsightSummary]
```

#### AnalysisTriggerResponse

```python
class AnalysisTriggerResponse(BaseModel):
    message: str
    insight_id: int
    stock_code: str
    stock_name: str
    recommendation: str
```

---

## 데이터베이스 연결

**위치:** `app/core/database.py`

### 설정

```python
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./stock_insights.db"

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

### 세션 의존성

```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session
```

### 테이블 생성

서버 시작 시 자동으로 테이블이 생성됩니다.

```python
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
```
