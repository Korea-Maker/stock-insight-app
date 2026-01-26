# Data Flow

Stock Insight App의 데이터 흐름 문서입니다.

## 주요 플로우

1. [분석 요청 플로우](#분석-요청-플로우)
2. [분석 조회 플로우](#분석-조회-플로우)
3. [결제 플로우](#결제-플로우)

---

## 분석 요청 플로우

사용자가 주식 분석을 요청하는 전체 흐름입니다.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           분석 요청 플로우                               │
└─────────────────────────────────────────────────────────────────────────┘

[1] 사용자 입력
    User → StockInput → "AAPL" 또는 "삼성전자" 입력
         → TimeframePicker → "mid" 선택
         → "분석 시작" 클릭

[2] 프론트엔드 상태 업데이트
    useAnalysisStore
    │
    ├─ setStockCode("AAPL")
    ├─ setTimeframe("mid")
    └─ setIsAnalyzing(true)

[3] API 요청
    ┌───────────────┐          ┌────────────────────────────┐
    │   Frontend    │  ──────> │  POST /api/analysis/stock  │
    │               │          │                            │
    │  fetch()      │          │  Body:                     │
    │               │          │  {                         │
    └───────────────┘          │    "stock_code": "AAPL",   │
                               │    "timeframe": "mid"      │
                               │  }                         │
                               └──────────────┬─────────────┘
                                              │
[4] 백엔드 처리                                │
    ┌──────────────────────────────────────────▼──────────────────────────┐
    │                        Analysis Router                               │
    │                                                                      │
    │  async def analyze_stock(request: StockAnalysisRequest):             │
    │      │                                                               │
    │      ├─ [결제 검증 - Polar 설정 시]                                  │
    │      │                                                               │
    │      └─ insight = await stock_insight_engine.generate_insight(...)   │
    └─────────────────────────────────────────┬────────────────────────────┘
                                              │
[5] 분석 엔진                                  │
    ┌─────────────────────────────────────────▼────────────────────────────┐
    │                      StockInsightEngine                               │
    │                                                                       │
    │  [5a] 주식 데이터 수집                                                │
    │       stock_data = await stock_data_service.get_stock_data("AAPL")   │
    │       │                                                               │
    │       ├─ US 종목 → Finnhub API 호출                                  │
    │       └─ KR 종목 → yfinance 호출                                     │
    │                                                                       │
    │  [5b] 프롬프트 생성                                                   │
    │       user_prompt = get_stock_analysis_user_prompt(...)               │
    │                                                                       │
    │  [5c] LLM API 호출                                                    │
    │       response, model = await self._call_llm(system_prompt, user_prompt)
    │       │                                                               │
    │       ├─ Primary: OpenAI GPT-4o-mini                                 │
    │       └─ Fallback: Anthropic Claude                                  │
    │                                                                       │
    │  [5d] 응답 파싱                                                       │
    │       parsed = parse_stock_analysis_response(response)                │
    │                                                                       │
    │  [5e] DB 저장                                                         │
    │       insight = StockInsight(...)                                     │
    │       db.add(insight)                                                 │
    │       await db.commit()                                               │
    └─────────────────────────────────────────┬────────────────────────────┘
                                              │
[6] 응답 반환                                  │
    ┌──────────────────────────────────────────▼──────────────────────────┐
    │  Response:                                                           │
    │  {                                                                   │
    │    "message": "분석이 성공적으로 완료되었습니다",                     │
    │    "insight_id": 1,                                                  │
    │    "stock_code": "AAPL",                                             │
    │    "stock_name": "Apple Inc.",                                       │
    │    "recommendation": "buy"                                           │
    │  }                                                                   │
    └─────────────────────────────────────────┬────────────────────────────┘
                                              │
[7] 프론트엔드 상태 업데이트                    │
    ┌──────────────────────────────────────────▼──────────────────────────┐
    │  useAnalysisStore                                                    │
    │  │                                                                   │
    │  ├─ setIsAnalyzing(false)                                            │
    │  └─ // 상세 조회를 위해 GET /api/analysis/{id} 호출                  │
    │                                                                      │
    │  // 상세 결과 수신 후                                                │
    │  └─ setCurrentInsight(fullInsight)                                   │
    └──────────────────────────────────────────────────────────────────────┘

[8] UI 렌더링
    AnalysisResult
    │
    ├─ RecommendationBadge → "Buy" 표시
    ├─ RiskGauge → 위험도 4/10 표시
    └─ SectionCard[] → 분석 상세 표시
```

---

## 분석 조회 플로우

### 상세 조회

```
User → Click on history item
     ↓
Frontend → GET /api/analysis/{id}
     ↓
Backend → SELECT * FROM stock_insights WHERE id = {id}
     ↓
Response → Full StockInsightResponse
     ↓
Frontend → setCurrentInsight(response)
     ↓
UI → Render AnalysisResult
```

### 히스토리 조회

```
User → Navigate to /history
     ↓
Frontend → GET /api/analysis/history?limit=20&skip=0
     ↓
Backend → SELECT * FROM stock_insights
          ORDER BY created_at DESC
          LIMIT 20 OFFSET 0
     ↓
Response → { total: 45, items: [...] }
     ↓
Frontend → setHistory(items, total)
     ↓
UI → Render AnalysisHistory list
```

### 최신 분석 조회

```
User → Input stock code
     ↓
Frontend → GET /api/analysis/latest?stock_code=AAPL
     ↓
Backend → SELECT * FROM stock_insights
          WHERE stock_code = 'AAPL'
          ORDER BY created_at DESC
          LIMIT 1
     ↓
Response → Full StockInsightResponse or 404
     ↓
Frontend → Display cached result or show "no analysis"
```

---

## 결제 플로우

Polar 결제가 설정된 경우의 흐름입니다.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            결제 플로우                                   │
└─────────────────────────────────────────────────────────────────────────┘

[1] 체크아웃 생성
    User → Click "분석 시작"
         ↓
    Frontend → POST /api/payment/checkout
               {
                 "stock_code": "AAPL",
                 "timeframe": "mid",
                 "success_url": "http://localhost:3000/success?checkout_id={CHECKOUT_ID}",
                 "cancel_url": "http://localhost:3000"
               }
         ↓
    Backend → PaymentService.create_checkout_session()
            → Polar API 호출
         ↓
    Response → {
                 "checkout_id": "chk_xxx",
                 "checkout_url": "https://checkout.polar.sh/...",
                 "status": "open"
               }

[2] 결제 페이지 리다이렉트
    Frontend → window.location.href = checkout_url
         ↓
    User → Polar 결제 페이지에서 결제 진행
         ↓
    Polar → 결제 완료 후 success_url로 리다이렉트

[3] 결제 검증
    Frontend → GET /api/payment/checkout/{checkout_id}/verify
         ↓
    Backend → PaymentService.verify_checkout_completed()
            → Polar API로 상태 확인
         ↓
    Response → { "verified": true } or 402 Error

[4] 분석 실행
    Frontend → POST /api/analysis/stock
               {
                 "stock_code": "AAPL",
                 "timeframe": "mid",
                 "checkout_id": "chk_xxx"
               }
         ↓
    Backend → 결제 검증 후 분석 실행

[5] 실패 시 환불
    분석 실패 → PaymentService.refund_by_checkout_id()
             → Polar API로 환불 처리
             → 사용자에게 환불 완료 알림
```

---

## 종목 검색 플로우

```
User → Type in StockInput
     ↓
Frontend → Debounce (300ms)
         → GET /api/analysis/search/stock?query=삼성
     ↓
Backend → StockDataService.search_stock("삼성")
        │
        ├─ KR_STOCK_MAPPING 검색 → 삼성전자, 삼성SDI...
        ├─ US_STOCK_MAPPING 검색 → (none)
        └─ Finnhub Symbol Search → (US symbols)
     ↓
Response → {
             "query": "삼성",
             "results": [
               { "symbol": "005930.KS", "name": "삼성전자", "market": "KR" },
               { "symbol": "006400.KS", "name": "삼성SDI", "market": "KR" }
             ]
           }
     ↓
Frontend → Show dropdown with results
     ↓
User → Click on result
     ↓
Frontend → setStockCode("005930.KS")
```

---

## 상태 다이어그램

### 분석 상태

```
         ┌─────────┐
         │  idle   │
         └────┬────┘
              │ 분석 요청
              ▼
         ┌─────────┐
    ┌────│analyzing│────┐
    │    └────┬────┘    │
    │         │         │
성공 │         │         │ 실패
    │         │         │
    ▼         │         ▼
┌───────┐     │    ┌───────┐
│success│     │    │ error │
└───┬───┘     │    └───┬───┘
    │         │        │
    │    리셋  │        │ 리셋
    └─────────┴────────┘
              │
              ▼
         ┌─────────┐
         │  idle   │
         └─────────┘
```

### 결제 상태

```
         ┌─────────┐
         │  idle   │
         └────┬────┘
              │ 결제 시작
              ▼
         ┌─────────────┐
         │ checking_out│
         └──────┬──────┘
                │
       ┌────────┴────────┐
       │                 │
  완료 │                 │ 취소
       ▼                 ▼
  ┌─────────┐       ┌─────────┐
  │  paid   │       │canceled │
  └────┬────┘       └────┬────┘
       │                 │
       │ 분석 시작        │ 리셋
       ▼                 │
  ┌─────────┐            │
  │analyzing│            │
  └────┬────┘            │
       │                 │
       └─────────────────┘
              │
              ▼
         ┌─────────┐
         │  idle   │
         └─────────┘
```

---

## 관련 문서

- [시스템 개요](./SYSTEM_OVERVIEW.md)
- [AI 파이프라인](./AI_PIPELINE.md)
- [API 문서](../api/ANALYSIS_API.md)
