# AI Analysis Pipeline

Stock Insight App의 AI 분석 파이프라인 상세 문서입니다.

## 개요

주식 딥리서치 분석은 다음 파이프라인을 통해 생성됩니다:

```
입력 → 데이터 수집 → 프롬프트 생성 → LLM 호출 → 응답 파싱 → 저장 → 반환
```

---

## 파이프라인 상세

### 1단계: 입력 처리

사용자 입력을 정규화합니다.

```
입력: "AAPL" | "삼성전자" | "005930.KS"
      ↓
resolve_stock_code()
      ↓
출력: ("AAPL", "US") | ("005930.KS", "KR")
```

**변환 규칙:**
- 영문 대문자 → US 종목
- 한글 종목명 → KR_STOCK_MAPPING 조회
- 6자리 숫자 → KR 종목 (코스피)
- `.KS`, `.KQ` 접미사 → KR 종목

### 2단계: 데이터 수집

외부 API에서 주식 데이터를 수집합니다.

```
                    ┌─────────────────┐
                    │  StockDataService│
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ Finnhub API  │  │   yfinance   │  │    Cache     │
    │   (US)       │  │    (KR)      │  │   (5분)      │
    └──────────────┘  └──────────────┘  └──────────────┘
```

**수집 데이터:**
- 현재 가격
- 가격 변동 (1일/1주/1개월)
- 시가총액
- PER, PBR
- 52주 고/저
- 거래량
- 베타
- 섹터/산업

### 3단계: 프롬프트 생성

수집된 데이터를 기반으로 LLM 프롬프트를 생성합니다.

```python
# System Prompt 구조
SYSTEM_PROMPT = """
당신은 전문 주식 분석가입니다.
다음 JSON 형식으로 분석 결과를 제공하세요:
{
  "deep_research": "...",
  "recommendation": "strong_buy|buy|hold|sell|strong_sell",
  "confidence_level": "high|medium|low",
  ...
}
"""

# User Prompt 구조
USER_PROMPT = """
종목: {stock_name} ({stock_code})
시장: {market}
투자 기간: {timeframe}

현재 데이터:
- 가격: ${current_price}
- 1일 변동: {price_change_1d}%
- 시가총액: ${market_cap}
- PER: {pe_ratio}
...

위 정보를 바탕으로 딥리서치 분석을 수행하세요.
"""
```

### 4단계: LLM API 호출

OpenAI 또는 Anthropic API를 호출합니다.

```
          ┌─────────────────┐
          │  LLM 호출 시작  │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ Primary Provider│
          │   (OpenAI)      │
          └────────┬────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
    성공 │                     │ 실패
        ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  응답 반환      │   │ Fallback        │
│                 │   │ (Anthropic)     │
└─────────────────┘   └────────┬────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                성공 │                     │ 실패
                    ▼                     ▼
            ┌─────────────────┐   ┌─────────────────┐
            │  응답 반환      │   │  에러 발생      │
            └─────────────────┘   └─────────────────┘
```

**OpenAI 설정:**
```python
response = await openai_client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ],
    max_tokens=4000,
    temperature=0.3,
    response_format={"type": "json_object"}
)
```

**Anthropic 설정:**
```python
response = await anthropic_client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=4000,
    system=system_prompt,
    messages=[
        {"role": "user", "content": user_prompt}
    ]
)
```

### 5단계: 응답 파싱

JSON 응답을 파싱하여 구조화된 데이터로 변환합니다.

```python
def parse_stock_analysis_response(response_text: str) -> dict:
    """
    LLM JSON 응답을 파싱

    Returns:
        {
            "deep_research": str,
            "recommendation": str,
            "confidence_level": str,
            "recommendation_reason": str,
            "risk_score": int,
            "risk_analysis": dict,
            "market_overview": dict,
            "market_sentiment": str,
            "sentiment_details": dict,
            "key_summary": list,
            "current_drivers": dict,
            "future_catalysts": dict
        }
    """
```

### 6단계: 데이터 저장

파싱된 결과를 데이터베이스에 저장합니다.

```python
insight = StockInsight(
    stock_code=stock_data.symbol,
    stock_name=stock_data.name,
    market=stock_data.market,
    timeframe=timeframe,
    deep_research=parsed_response["deep_research"],
    recommendation=parsed_response["recommendation"],
    # ... 기타 필드
    ai_model=model_used,
    processing_time_ms=processing_time_ms
)

db.add(insight)
await db.commit()
```

### 7단계: 결과 반환

저장된 분석 결과를 API 응답으로 반환합니다.

```json
{
  "message": "분석이 성공적으로 완료되었습니다",
  "insight_id": 1,
  "stock_code": "AAPL",
  "stock_name": "Apple Inc.",
  "recommendation": "buy"
}
```

---

## 분석 출력 항목

### 딥리서치 분석 (deep_research)

종합적인 투자 분석 리포트입니다. 다음 내용을 포함합니다:

- 회사 개요 및 비즈니스 모델
- 재무 상태 분석
- 경쟁 환경
- 성장 전망
- 투자 논거

### 투자 의사결정 (recommendation)

| 값 | 의미 | 설명 |
|----|------|------|
| strong_buy | 적극 매입 | 높은 확신의 매수 추천 |
| buy | 매입 | 일반적인 매수 추천 |
| hold | 홀드 | 현재 포지션 유지 |
| sell | 매도 | 일반적인 매도 추천 |
| strong_sell | 적극 매도 | 높은 확신의 매도 추천 |

### 신뢰도 (confidence_level)

| 값 | 의미 |
|----|------|
| high | 분석에 높은 확신 |
| medium | 중간 수준의 확신 |
| low | 불확실성이 높음 |

### 위험도 점수 (risk_score)

1-10 척도:
- 1-3: 저위험
- 4-6: 중위험
- 7-10: 고위험

### 시장 심리 (market_sentiment)

| 값 | 의미 |
|----|------|
| bullish | 강세 전망 |
| neutral | 중립 전망 |
| bearish | 약세 전망 |

---

## 투자 기간별 분석 차이

### 단기 (short: 1-3개월)
- 기술적 분석 중심
- 단기 가격 모멘텀
- 이벤트 드리븐 분석
- 변동성 평가

### 중기 (mid: 3-12개월)
- 펀더멘털 + 기술적 분석
- 실적 전망
- 산업 트렌드
- 밸류에이션 분석

### 장기 (long: 1년+)
- 펀더멘털 분석 중심
- 비즈니스 모델 지속성
- 경쟁 우위
- 장기 성장 전략

---

## 에러 처리

### LLM API 에러

```python
try:
    response = await self._call_openai_api(...)
except Exception as e:
    logger.error(f"OpenAI API 호출 실패: {e}")
    # Anthropic으로 폴백
    response = await self._call_anthropic_api(...)
```

### 데이터 수집 에러

```python
stock_data = await stock_data_service.get_stock_data(stock_code)
if not stock_data:
    raise HTTPException(
        status_code=404,
        detail=f"종목 '{stock_code}'을(를) 찾을 수 없습니다"
    )
```

### 파싱 에러

```python
try:
    parsed = json.loads(response_text)
except json.JSONDecodeError:
    # JSON 블록 추출 시도
    json_match = re.search(r'\{[\s\S]*\}', response_text)
    if json_match:
        parsed = json.loads(json_match.group())
```

---

## 성능

### 평균 처리 시간

| 단계 | 시간 |
|------|------|
| 데이터 수집 | 0.5-2초 |
| LLM API 호출 | 3-8초 |
| 파싱 및 저장 | 0.1초 |
| **전체** | **4-10초** |

### 캐싱

- 주식 데이터: 5분 TTL 메모리 캐시
- LLM 응답: 캐싱 없음 (매번 새로 생성)

---

## 관련 문서

- [시스템 개요](./SYSTEM_OVERVIEW.md)
- [데이터 흐름](./DATA_FLOW.md)
- [백엔드 서비스](../backend/SERVICES.md)
