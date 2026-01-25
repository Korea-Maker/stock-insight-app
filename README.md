# Stock Insight App

> AI 기반 주식 딥리서치 분석 애플리케이션
>
> AI-Powered Stock Deep Research Analysis Application

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)

---

## Overview

Stock Insight App은 AI를 활용한 주식 딥리서치 분석 애플리케이션입니다. 종목코드 또는 회사명을 입력하고 투자 기간을 선택하면 AI가 종합적인 투자 분석 보고서를 생성합니다.

### Key Features

- **종목 검색 및 자동완성**: Finnhub API 기반 실시간 종목 검색
- **투자 기간 선택**: 단기(1-3개월), 중기(3-12개월), 장기(1년+)
- **AI 딥리서치 분석**: OpenAI GPT-4 기반 종합 투자 분석
- **투자 의사결정**: 적극매입/매입/홀드/매도/적극매도 추천
- **위험도 평가**: 1-10점 스케일의 위험도 분석
- **시장 심리 분석**: Bullish/Neutral/Bearish 판단
- **분석 히스토리**: 이전 분석 결과 저장 및 조회
- **다크/라이트 테마**: 사용자 선호에 따른 테마 전환

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router), React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4, shadcn/ui
- **State Management**: Zustand
- **Icons**: lucide-react
- **Date**: date-fns

### Backend
- **Framework**: FastAPI (Async)
- **Language**: Python 3.11+
- **Database**: SQLite (SQLAlchemy)
- **AI**: OpenAI GPT-4o-mini (기본), Anthropic Claude (폴백)
- **Stock Data**: Finnhub API

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+
- **Finnhub API Key** (무료: https://finnhub.io/)
- **OpenAI API Key** (https://platform.openai.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/Korea-Maker/stock-insight-app.git
cd stock-insight-app
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp env.example .env

# Edit .env with your API keys
# FINNHUB_API=your_finnhub_api_key
# OPENAI_API_KEY=your_openai_api_key

# Start the server
python main.py
```

Backend: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend: http://localhost:3000

---

## API Endpoints

### Analysis API

```http
# 주식 분석 실행
POST /api/analysis/stock
Content-Type: application/json
{
  "stock_code": "AAPL",
  "timeframe": "mid"
}

# 분석 히스토리 조회
GET /api/analysis/history?limit=10

# 특정 분석 결과 조회
GET /api/analysis/{id}

# 종목 검색
GET /api/analysis/search?q=apple
```

### Health Check

```http
GET /health
```

---

## Project Structure

```
stock-insight-app/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py          # 환경 설정
│   │   │   └── database.py        # SQLite 데이터베이스
│   │   ├── models/
│   │   │   └── stock_insight.py   # 분석 결과 모델
│   │   ├── routers/
│   │   │   └── analysis.py        # 분석 API 라우터
│   │   ├── schemas/
│   │   │   └── analysis.py        # Pydantic 스키마
│   │   └── services/
│   │       ├── stock_data_service.py    # Finnhub 데이터 서비스
│   │       ├── stock_insight_engine.py  # AI 분석 엔진
│   │       ├── prompts.py               # LLM 프롬프트
│   │       └── response_parser.py       # 응답 파서
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # 메인 페이지
│   │   ├── dashboard/page.tsx     # 대시보드
│   │   ├── history/page.tsx       # 히스토리
│   │   └── analysis/[id]/page.tsx # 분석 상세
│   ├── components/
│   │   ├── Analysis/              # 분석 관련 컴포넌트
│   │   │   ├── AnalysisForm.tsx
│   │   │   ├── AnalysisResult.tsx
│   │   │   ├── AnalysisHistory.tsx
│   │   │   ├── RecommendationBadge.tsx
│   │   │   └── RiskGauge.tsx
│   │   ├── Stock/                 # 종목 입력 컴포넌트
│   │   │   ├── StockInput.tsx
│   │   │   └── TimeframePicker.tsx
│   │   ├── Layout/
│   │   ├── Navigation/
│   │   ├── Theme/
│   │   └── ui/                    # shadcn/ui
│   ├── lib/
│   │   └── api/analysis.ts        # API 클라이언트
│   ├── store/
│   │   └── useAnalysisStore.ts    # Zustand 스토어
│   └── types/
│       └── stock.ts               # 타입 정의
│
└── docs/
```

---

## Environment Variables

### Backend (.env)

```bash
# Database
POSTGRES_USER=quantboard
POSTGRES_PASSWORD=quantboard_dev
POSTGRES_DB=quantboard
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# API
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development

# AI APIs
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional (fallback)

# Stock Data
FINNHUB_API=your_finnhub_api_key

# LLM Settings
LLM_PRIMARY_PROVIDER=openai  # openai or anthropic
```

---

## Analysis Output Format

분석 결과는 다음 정보를 포함합니다:

| 항목 | 설명 |
|------|------|
| **딥리서치 분석** | 종합적인 기업 및 시장 분석 |
| **투자 의사결정** | strong_buy / buy / hold / sell / strong_sell |
| **신뢰도** | high / medium / low |
| **위험도 점수** | 1-10 (높을수록 위험) |
| **위험 분석** | 변동성, 회사 리스크, 산업 리스크, 거시경제 |
| **시장 현황** | 현재가, 가격 변동, 지지/저항선 |
| **시장 심리** | bullish / neutral / bearish |
| **핵심 요약** | 주요 포인트 3-5개 |
| **현재 변동 요인** | 뉴스, 기술적, 펀더멘털 요인 |
| **미래 촉매** | 단기, 중기, 장기 촉매 |

---

## Screenshots

### 메인 화면
- 종목 검색 (자동완성)
- 투자 기간 선택
- 분석 시작 버튼

### 분석 결과
- 투자 의사결정 배지
- 위험도 게이지
- 딥리서치 보고서
- 시장 심리 분석

### 히스토리
- 이전 분석 목록
- 시간 표시 (KST)
- 빠른 재조회

---

## Development

### Backend

```bash
cd backend
python main.py  # uvicorn with auto-reload
```

API Docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm run dev     # Development
npm run build   # Production build
npm run lint    # ESLint
```

---

## Supported Markets

| 시장 | 지원 여부 | 예시 |
|------|----------|------|
| 미국 (US) | O | AAPL, GOOGL, MSFT, TSLA |
| 한국 (KR) | X (데이터 소스 제한) | - |

> 참고: Finnhub 무료 티어는 미국 주식만 지원합니다.

---

## License

MIT License - see [LICENSE](LICENSE)

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

**Built with AI for smarter investment decisions**
