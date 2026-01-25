# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stock Insight App** - AI 기반 주식 딥리서치 분석 애플리케이션. 종목코드/회사명을 입력하면 AI가 투자 분석 보고서를 생성합니다.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, lucide-react
- **State Management:** Zustand
- **Backend:** Python FastAPI (Async), SQLAlchemy
- **Database:** SQLite (stock_insights.db)
- **AI:** OpenAI GPT-4o-mini (primary), Anthropic Claude (fallback)
- **Stock Data:** Finnhub API (US stocks only)

## Commands

### Backend

```bash
cd backend

# 가상환경 활성화
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# 서버 실행 (auto-reload)
python main.py

# 의존성 설치
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

## Architecture

### Backend 구조
```
backend/
├── main.py                     # FastAPI 진입점
├── app/
│   ├── core/
│   │   ├── config.py           # Pydantic Settings (환경변수)
│   │   └── database.py         # SQLAlchemy (SQLite)
│   ├── models/
│   │   └── stock_insight.py    # StockInsight 모델
│   ├── routers/
│   │   └── analysis.py         # 분석 API 라우터
│   ├── schemas/
│   │   └── analysis.py         # Pydantic 스키마
│   └── services/
│       ├── stock_data_service.py    # Finnhub API 연동
│       ├── stock_insight_engine.py  # AI 분석 엔진
│       ├── prompts.py               # LLM 프롬프트
│       └── response_parser.py       # JSON 응답 파싱
```

### Frontend 구조
```
frontend/
├── app/                        # Next.js App Router
│   ├── page.tsx                # 메인 페이지
│   ├── dashboard/page.tsx      # 대시보드
│   ├── history/page.tsx        # 분석 히스토리
│   └── analysis/[id]/page.tsx  # 분석 상세
├── components/
│   ├── Analysis/               # 분석 결과 컴포넌트
│   │   ├── AnalysisForm.tsx
│   │   ├── AnalysisResult.tsx
│   │   ├── AnalysisHistory.tsx
│   │   ├── RecommendationBadge.tsx
│   │   └── RiskGauge.tsx
│   ├── Stock/                  # 종목 입력 컴포넌트
│   │   ├── StockInput.tsx      # 자동완성 검색
│   │   └── TimeframePicker.tsx # 투자 기간 선택
│   ├── Layout/MainLayout.tsx
│   ├── Navigation/TopNav.tsx
│   └── Theme/                  # 다크/라이트 테마
├── lib/api/analysis.ts         # API 클라이언트
├── store/useAnalysisStore.ts   # Zustand 상태
└── types/stock.ts              # 타입 정의
```

## API Endpoints

```
GET  /health                    # 헬스 체크
POST /api/analysis/stock        # 주식 분석 실행
GET  /api/analysis/history      # 분석 히스토리
GET  /api/analysis/{id}         # 분석 상세 조회
GET  /api/analysis/search       # 종목 검색
```

## Data Flow

**분석 요청:**
1. Frontend: 종목코드 + 투자기간 입력
2. Backend: Finnhub API에서 주식 데이터 조회
3. Backend: OpenAI/Anthropic API로 딥리서치 분석
4. Backend: SQLite에 결과 저장
5. Frontend: 분석 결과 표시

## Key Features

### 분석 출력 항목
- **딥리서치 분석**: 종합 투자 분석
- **투자 의사결정**: strong_buy/buy/hold/sell/strong_sell
- **신뢰도**: high/medium/low
- **위험도 점수**: 1-10
- **시장 심리**: bullish/neutral/bearish
- **핵심 요약**: 주요 포인트 리스트
- **변동 요인**: 뉴스/기술적/펀더멘털
- **미래 촉매**: 단기/중기/장기

## Environment Variables

Backend (`backend/.env`):
```
# API Keys
OPENAI_API_KEY=sk-...
FINNHUB_API=your_finnhub_key

# Optional
ANTHROPIC_API_KEY=sk-ant-...

# Settings
LLM_PRIMARY_PROVIDER=openai
API_PORT=8000
```

## Development Rules

- TypeScript strict 모드 사용
- Pydantic 모델 필수
- 실제 API 데이터 사용 (Mock 금지)
- `use client` 최소화 (서버 컴포넌트 우선)
- Zustand로 상태 관리
- SSL 검증 비활성화 (회사 네트워크 환경)

## Supported Markets

| 시장 | 지원 | 비고 |
|------|------|------|
| US | O | AAPL, GOOGL, MSFT, TSLA 등 |
| KR | X | Finnhub 무료 티어 미지원 |

## Common Tasks

### 새 분석 실행
```bash
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -d '{"stock_code": "AAPL", "timeframe": "mid"}'
```

### 분석 결과 조회
```bash
curl http://localhost:8000/api/analysis/1
```

### 히스토리 조회
```bash
curl http://localhost:8000/api/analysis/history?limit=10
```
