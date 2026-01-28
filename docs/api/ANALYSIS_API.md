# Analysis API

> **최종 업데이트:** 2025-01-28

주식 딥리서치 분석 API 엔드포인트 문서입니다.

**Base URL:** `http://localhost:8000/api/analysis`

## 인증

대부분의 엔드포인트는 `X-User-Id` 헤더가 필요합니다. 자세한 내용은 [API 인증 문서](./AUTHENTICATION.md)를 참조하세요.

```bash
# 인증 헤더 예시
curl http://localhost:8000/api/analysis/history \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000"
```

| 엔드포인트 | X-User-Id 필수 |
|-----------|---------------|
| `POST /stock` | **필수** |
| `GET /latest` | **필수** |
| `GET /history` | **필수** |
| `GET /{insight_id}` | **필수** |
| `GET /search/stock` | 불필요 |

## 엔드포인트 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/stock` | 주식 분석 실행 |
| GET | `/latest` | 최신 분석 조회 |
| GET | `/history` | 분석 히스토리 |
| GET | `/search/stock` | 종목 검색 |
| GET | `/{insight_id}` | 분석 상세 조회 |

---

## POST /stock

주식 딥리서치 분석을 실행합니다.

**인증:** `X-User-Id` 헤더 필수

### Request

**Headers:**
```
Content-Type: application/json
X-User-Id: <UUID v4>
```

**Body:**
```json
{
  "stock_code": "AAPL",
  "timeframe": "mid",
  "checkout_id": null
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| stock_code | string | ✅ | 종목코드 또는 회사명 (AAPL, 삼성전자, 005930.KS) |
| timeframe | enum | ✅ | 투자 기간: `short`, `mid`, `long` |
| checkout_id | string | ❌ | 결제 체크아웃 ID (Polar 결제 사용 시) |

### Response (200 OK)

```json
{
  "message": "분석이 성공적으로 완료되었습니다",
  "insight_id": 1,
  "stock_code": "AAPL",
  "stock_name": "Apple Inc.",
  "recommendation": "buy"
}
```

### Error Responses

| 상태 코드 | 설명 |
|-----------|------|
| 402 | 결제 필요 (Polar 설정 시) |
| 404 | 종목을 찾을 수 없음 |
| 500 | 분석 중 오류 발생 |

### 예시

```bash
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000" \
  -d '{"stock_code": "TSLA", "timeframe": "short"}'
```

---

## GET /latest

특정 종목의 가장 최신 분석 결과를 조회합니다.

**인증:** `X-User-Id` 헤더 필수 (본인 데이터만 조회)

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| stock_code | string | ✅ | 종목코드 (예: AAPL, 005930.KS) |

### Response (200 OK)

```json
{
  "id": 1,
  "stock_code": "AAPL",
  "stock_name": "Apple Inc.",
  "market": "US",
  "timeframe": "mid",
  "created_at": "2024-01-15T10:30:00Z",
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
  "market_overview": {
    "price_movement": "상승 추세",
    "volume_trend": "평균 이상",
    "support_resistance": "지지선 $180, 저항선 $195",
    "relative_performance": "S&P 500 대비 아웃퍼폼"
  },
  "market_sentiment": "bullish",
  "sentiment_details": {
    "overall": "긍정적",
    "social_media": "매우 긍정적",
    "options_activity": "콜 옵션 증가",
    "insider_trading": "경영진 매수",
    "institutional": "기관 매수 증가",
    "short_interest": "낮음 (2.1%)"
  },
  "key_summary": [
    "서비스 매출 사상 최고치 달성",
    "AI 기술 투자 확대",
    "iPhone 판매 안정적"
  ],
  "current_drivers": {
    "news_based": "AI 파트너십 발표",
    "technical": "50일 이평선 돌파",
    "fundamental": "EPS 예상치 상회"
  },
  "future_catalysts": {
    "short_term": "신제품 발표 (3월)",
    "mid_term": "AI 기능 탑재 iOS 업데이트",
    "long_term": "AR/VR 디바이스 확대"
  },
  "ai_model": "gpt-4o-mini",
  "processing_time_ms": 4523
}
```

### 예시

```bash
curl "http://localhost:8000/api/analysis/latest?stock_code=AAPL" \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000"
```

---

## GET /history

분석 이력을 페이지네이션하여 조회합니다.

**인증:** `X-User-Id` 헤더 필수 (본인 데이터만 조회)

### Query Parameters

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| stock_code | string | null | 종목코드 필터 (없으면 전체) |
| limit | int | 20 | 가져올 항목 수 (최대 100) |
| skip | int | 0 | 건너뛸 항목 수 |

### Response (200 OK)

```json
{
  "total": 45,
  "items": [
    {
      "id": 45,
      "stock_code": "TSLA",
      "stock_name": "Tesla, Inc.",
      "market": "US",
      "timeframe": "mid",
      "recommendation": "hold",
      "risk_score": 7,
      "current_price": 242.50,
      "created_at": "2024-01-15T14:20:00Z"
    },
    {
      "id": 44,
      "stock_code": "AAPL",
      "stock_name": "Apple Inc.",
      "market": "US",
      "timeframe": "long",
      "recommendation": "buy",
      "risk_score": 3,
      "current_price": 185.92,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 예시

```bash
# 전체 이력 (최신 20개)
curl "http://localhost:8000/api/analysis/history" \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000"

# 특정 종목 이력
curl "http://localhost:8000/api/analysis/history?stock_code=AAPL&limit=10" \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000"

# 페이지네이션
curl "http://localhost:8000/api/analysis/history?skip=20&limit=20" \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000"
```

---

## GET /search/stock

종목을 검색합니다. 한국/미국 종목 모두 지원합니다.

**인증:** 불필요 (공개 데이터)

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| query | string | ✅ | 검색어 (종목명 또는 코드) |

### Response (200 OK)

```json
{
  "query": "삼성",
  "results": [
    {
      "symbol": "005930.KS",
      "name": "삼성전자",
      "market": "KR"
    },
    {
      "symbol": "006400.KS",
      "name": "삼성SDI",
      "market": "KR"
    },
    {
      "symbol": "009150.KS",
      "name": "삼성전기",
      "market": "KR"
    }
  ]
}
```

### 예시

```bash
# 한국 종목 검색
curl "http://localhost:8000/api/analysis/search/stock?query=삼성"

# 미국 종목 검색
curl "http://localhost:8000/api/analysis/search/stock?query=apple"
```

---

## GET /{insight_id}

특정 분석 결과를 ID로 조회합니다.

**인증:** `X-User-Id` 헤더 필수 (소유권 검증)

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| insight_id | int | 분석 ID |

### Response (200 OK)

`GET /latest`와 동일한 응답 구조

### Error Responses

| 상태 코드 | 설명 |
|-----------|------|
| 404 | 분석 ID를 찾을 수 없음 |

### 예시

```bash
curl http://localhost:8000/api/analysis/1 \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000"
```

---

## 데이터 타입

### InvestmentTimeframe (투자 기간)

| 값 | 설명 |
|----|------|
| `short` | 단기 (1-3개월) |
| `mid` | 중기 (3-12개월) |
| `long` | 장기 (1년+) |

### TradingRecommendation (투자 의사결정)

| 값 | 설명 |
|----|------|
| `strong_buy` | 적극 매입 |
| `buy` | 매입 |
| `hold` | 홀드 |
| `sell` | 매도 |
| `strong_sell` | 적극 매도 |

### ConfidenceLevel (신뢰도)

| 값 | 설명 |
|----|------|
| `low` | 낮음 |
| `medium` | 중간 |
| `high` | 높음 |

### MarketSentiment (시장 심리)

| 값 | 설명 |
|----|------|
| `bullish` | 강세 |
| `neutral` | 중립 |
| `bearish` | 약세 |

### RiskScore (위험도 점수)

1-10 정수 값
- 1-3: 저위험
- 4-6: 중위험
- 7-10: 고위험
