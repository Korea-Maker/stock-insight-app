# Frontend Components

Stock Insight App의 React 컴포넌트 구조 문서입니다.

## 디렉토리 구조

```
frontend/components/
├── Analysis/                    # 분석 결과 관련
│   ├── AnalysisForm.tsx         # 분석 요청 폼
│   ├── AnalysisResult.tsx       # 분석 결과 표시
│   ├── AnalysisHistory.tsx      # 분석 히스토리 목록
│   ├── RecommendationBadge.tsx  # 투자 의사결정 뱃지
│   ├── RiskGauge.tsx            # 위험도 게이지
│   └── SectionCard.tsx          # 섹션 카드 래퍼
├── Stock/                       # 종목 입력 관련
│   ├── StockInput.tsx           # 종목 검색/입력
│   └── TimeframePicker.tsx      # 투자 기간 선택
├── Layout/                      # 레이아웃
│   └── MainLayout.tsx           # 메인 레이아웃
├── Navigation/                  # 네비게이션
│   └── TopNav.tsx               # 상단 네비게이션
├── Theme/                       # 테마 관련
│   ├── ThemeProvider.tsx        # 테마 컨텍스트
│   └── ThemeToggle.tsx          # 다크/라이트 토글
├── Legal/                       # 법적 고지
│   └── Disclaimer.tsx           # 투자 면책 조항
└── ui/                          # shadcn/ui 컴포넌트
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    ├── checkbox.tsx
    ├── input.tsx
    ├── skeleton.tsx
    └── tabs.tsx
```

---

## Analysis 컴포넌트

### AnalysisForm

분석 요청 폼 컴포넌트입니다.

**위치:** `components/Analysis/AnalysisForm.tsx`

**기능:**
- 종목코드/회사명 입력 (StockInput 사용)
- 투자 기간 선택 (TimeframePicker 사용)
- 분석 요청 제출
- 로딩 상태 표시

**사용:**
```tsx
import { AnalysisForm } from '@/components/Analysis/AnalysisForm'

<AnalysisForm onSubmit={handleAnalysis} />
```

### AnalysisResult

분석 결과를 표시하는 메인 컴포넌트입니다.

**위치:** `components/Analysis/AnalysisResult.tsx`

**기능:**
- 딥리서치 분석 내용 표시
- 투자 의사결정 (RecommendationBadge)
- 위험도 게이지 (RiskGauge)
- 시장 현황, 심리, 촉매 등 섹션별 표시

**Props:**
```tsx
interface AnalysisResultProps {
  insight: StockInsight
}
```

### AnalysisHistory

분석 히스토리 목록 컴포넌트입니다.

**위치:** `components/Analysis/AnalysisHistory.tsx`

**기능:**
- 이전 분석 목록 표시
- 페이지네이션
- 종목별 필터링
- 상세 페이지 링크

### RecommendationBadge

투자 의사결정을 뱃지로 표시합니다.

**위치:** `components/Analysis/RecommendationBadge.tsx`

**Props:**
```tsx
interface RecommendationBadgeProps {
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell'
}
```

**색상 매핑:**
| 의사결정 | 색상 |
|----------|------|
| strong_buy | 초록색 (진한) |
| buy | 초록색 |
| hold | 회색 |
| sell | 빨간색 |
| strong_sell | 빨간색 (진한) |

### RiskGauge

위험도를 시각적 게이지로 표시합니다.

**위치:** `components/Analysis/RiskGauge.tsx`

**Props:**
```tsx
interface RiskGaugeProps {
  score: number  // 1-10
}
```

**색상 단계:**
- 1-3: 초록색 (저위험)
- 4-6: 노란색 (중위험)
- 7-10: 빨간색 (고위험)

### SectionCard

분석 결과 섹션을 감싸는 카드 컴포넌트입니다.

**위치:** `components/Analysis/SectionCard.tsx`

**Props:**
```tsx
interface SectionCardProps {
  title: string
  children: React.ReactNode
}
```

---

## Stock 컴포넌트

### StockInput

종목 검색 및 입력 컴포넌트입니다.

**위치:** `components/Stock/StockInput.tsx`

**기능:**
- 자동완성 검색
- 한국/미국 종목 지원
- 검색 결과 드롭다운
- 키보드 네비게이션

**Props:**
```tsx
interface StockInputProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (stock: StockSearchResult) => void
}
```

### TimeframePicker

투자 기간 선택 컴포넌트입니다.

**위치:** `components/Stock/TimeframePicker.tsx`

**옵션:**
| 값 | 라벨 | 설명 |
|----|------|------|
| short | 단기 | 1-3개월 |
| mid | 중기 | 3-12개월 |
| long | 장기 | 1년+ |

**Props:**
```tsx
interface TimeframePickerProps {
  value: InvestmentTimeframe
  onChange: (timeframe: InvestmentTimeframe) => void
}
```

---

## Layout 컴포넌트

### MainLayout

메인 레이아웃 컴포넌트입니다.

**위치:** `components/Layout/MainLayout.tsx`

**구조:**
```
┌─────────────────────────────────┐
│           TopNav                │
├─────────────────────────────────┤
│                                 │
│           children              │
│                                 │
├─────────────────────────────────┤
│           Disclaimer            │
└─────────────────────────────────┘
```

**사용:**
```tsx
import { MainLayout } from '@/components/Layout/MainLayout'

<MainLayout>
  <YourContent />
</MainLayout>
```

---

## Navigation 컴포넌트

### TopNav

상단 네비게이션 바입니다.

**위치:** `components/Navigation/TopNav.tsx`

**요소:**
- 로고/앱 이름
- 메뉴 링크 (홈, 대시보드, 히스토리)
- 테마 토글 (ThemeToggle)

---

## Theme 컴포넌트

### ThemeProvider

테마 컨텍스트 프로바이더입니다.

**위치:** `components/Theme/ThemeProvider.tsx`

**기능:**
- 다크/라이트 모드 관리
- localStorage 저장
- 시스템 설정 감지

**사용:**
```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/Theme/ThemeProvider'

<ThemeProvider>
  <App />
</ThemeProvider>
```

### ThemeToggle

테마 전환 버튼입니다.

**위치:** `components/Theme/ThemeToggle.tsx`

**기능:**
- 현재 테마 아이콘 표시 (해/달)
- 클릭 시 테마 전환
- 애니메이션 효과

---

## Legal 컴포넌트

### Disclaimer

투자 면책 조항을 표시합니다.

**위치:** `components/Legal/Disclaimer.tsx`

**내용:**
- 투자 조언이 아님을 명시
- AI 분석의 한계 설명
- 투자 결정은 본인 책임

---

## UI 컴포넌트 (shadcn/ui)

shadcn/ui 기반의 재사용 가능한 UI 컴포넌트입니다.

| 컴포넌트 | 용도 |
|----------|------|
| Badge | 라벨, 태그 |
| Button | 버튼 |
| Card | 카드 컨테이너 |
| Checkbox | 체크박스 |
| Input | 텍스트 입력 |
| Skeleton | 로딩 스켈레톤 |
| Tabs | 탭 네비게이션 |

**사용:**
```tsx
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```
