# Frontend Stores

Stock Insight App의 Zustand 상태 관리 문서입니다.

## 개요

상태 관리에 **Zustand**를 사용합니다. 단일 스토어로 분석 관련 모든 상태를 관리합니다.

## useAnalysisStore

**위치:** `frontend/store/useAnalysisStore.ts`

### 상태 (State)

```typescript
interface AnalysisState {
  // 현재 분석 상태
  isAnalyzing: boolean          // 분석 진행 중 여부
  currentInsight: StockInsight | null  // 현재 분석 결과
  error: string | null          // 에러 메시지

  // 입력 상태
  stockCode: string             // 종목코드/회사명 입력값
  timeframe: InvestmentTimeframe  // 투자 기간 (short, mid, long)

  // 분석 이력
  history: StockInsightSummary[]  // 이력 목록
  historyTotal: number          // 전체 이력 수

  // 결제 상태
  checkoutId: string | null     // 체크아웃 세션 ID
  isCheckingOut: boolean        // 결제 진행 중 여부
}
```

### 액션 (Actions)

| 액션 | 설명 |
|------|------|
| `setStockCode(code: string)` | 종목코드 설정 |
| `setTimeframe(timeframe: InvestmentTimeframe)` | 투자 기간 설정 |
| `setIsAnalyzing(isAnalyzing: boolean)` | 분석 상태 설정 |
| `setCurrentInsight(insight: StockInsight \| null)` | 현재 분석 결과 설정 |
| `setError(error: string \| null)` | 에러 메시지 설정 |
| `setHistory(history: StockInsightSummary[], total: number)` | 이력 설정 |
| `setCheckoutId(checkoutId: string \| null)` | 체크아웃 ID 설정 |
| `setIsCheckingOut(isCheckingOut: boolean)` | 결제 상태 설정 |
| `reset()` | 전체 상태 초기화 |

### 초기 상태

```typescript
const initialState = {
  isAnalyzing: false,
  currentInsight: null,
  error: null,
  stockCode: '',
  timeframe: 'mid' as InvestmentTimeframe,
  history: [],
  historyTotal: 0,
  checkoutId: null,
  isCheckingOut: false,
}
```

### 사용 예시

#### 기본 사용

```tsx
import { useAnalysisStore } from '@/store/useAnalysisStore'

function AnalysisForm() {
  const {
    stockCode,
    timeframe,
    setStockCode,
    setTimeframe,
    isAnalyzing,
  } = useAnalysisStore()

  return (
    <div>
      <input
        value={stockCode}
        onChange={(e) => setStockCode(e.target.value)}
        disabled={isAnalyzing}
      />
      <select
        value={timeframe}
        onChange={(e) => setTimeframe(e.target.value)}
      >
        <option value="short">단기</option>
        <option value="mid">중기</option>
        <option value="long">장기</option>
      </select>
    </div>
  )
}
```

#### 분석 결과 표시

```tsx
function AnalysisResult() {
  const { currentInsight, error, isAnalyzing } = useAnalysisStore()

  if (isAnalyzing) {
    return <LoadingSpinner />
  }

  if (error) {
    return <ErrorMessage message={error} />
  }

  if (!currentInsight) {
    return <EmptyState />
  }

  return (
    <div>
      <h1>{currentInsight.stock_name}</h1>
      <p>{currentInsight.deep_research}</p>
      <Badge>{currentInsight.recommendation}</Badge>
    </div>
  )
}
```

#### 분석 실행

```tsx
import { analyzeStock } from '@/lib/api/analysis'

function useAnalysis() {
  const {
    stockCode,
    timeframe,
    checkoutId,
    setIsAnalyzing,
    setCurrentInsight,
    setError,
    reset,
  } = useAnalysisStore()

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await analyzeStock({
        stock_code: stockCode,
        timeframe,
        checkout_id: checkoutId,
      })

      // 상세 조회
      const insight = await getAnalysisById(result.insight_id)
      setCurrentInsight(insight)
    } catch (e) {
      setError(e.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return { runAnalysis }
}
```

#### 이력 조회

```tsx
import { getAnalysisHistory } from '@/lib/api/analysis'

function useAnalysisHistory() {
  const { setHistory } = useAnalysisStore()

  const fetchHistory = async (stockCode?: string) => {
    const response = await getAnalysisHistory({
      stock_code: stockCode,
      limit: 20,
    })

    setHistory(response.items, response.total)
  }

  return { fetchHistory }
}
```

### 선택적 구독 (Selective Subscription)

성능 최적화를 위해 필요한 상태만 구독합니다.

```tsx
// 전체 상태 구독 (비권장)
const state = useAnalysisStore()

// 필요한 상태만 구독 (권장)
const isAnalyzing = useAnalysisStore((s) => s.isAnalyzing)
const stockCode = useAnalysisStore((s) => s.stockCode)

// 여러 상태를 객체로 구독 (shallow 비교 필요)
import { shallow } from 'zustand/shallow'

const { stockCode, timeframe } = useAnalysisStore(
  (s) => ({ stockCode: s.stockCode, timeframe: s.timeframe }),
  shallow
)
```

## 타입 정의

### StockInsight

```typescript
interface StockInsight {
  id: number
  stock_code: string
  stock_name: string
  market: 'US' | 'KR'
  timeframe: InvestmentTimeframe
  created_at: string

  deep_research: string
  recommendation: TradingRecommendation
  confidence_level: ConfidenceLevel
  recommendation_reason?: string

  risk_score: number
  risk_analysis?: RiskAnalysis

  current_price?: number
  price_change_1d?: number
  price_change_1w?: number
  price_change_1m?: number
  market_overview?: MarketOverview

  market_sentiment?: MarketSentiment
  sentiment_details?: SentimentDetails

  key_summary?: string[]
  current_drivers?: CurrentDrivers
  future_catalysts?: FutureCatalysts

  ai_model?: string
  processing_time_ms?: number
}
```

### StockInsightSummary

```typescript
interface StockInsightSummary {
  id: number
  stock_code: string
  stock_name: string
  market: 'US' | 'KR'
  timeframe: InvestmentTimeframe
  recommendation: TradingRecommendation
  risk_score: number
  current_price?: number
  created_at: string
}
```

### InvestmentTimeframe

```typescript
type InvestmentTimeframe = 'short' | 'mid' | 'long'
```

### TradingRecommendation

```typescript
type TradingRecommendation =
  | 'strong_buy'
  | 'buy'
  | 'hold'
  | 'sell'
  | 'strong_sell'
```
