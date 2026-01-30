# System Architecture Overview

Stock Insight App의 전체 시스템 아키텍처 문서입니다.

## 시스템 개요

Stock Insight App은 AI 기반 주식 딥리서치 분석 서비스입니다.
사용자가 종목코드를 입력하면 AI가 투자 분석 보고서를 생성합니다.

### 설계 원칙

1. **비동기 우선**: 모든 I/O 작업에 async/await 사용
2. **단순성**: SQLite 사용으로 인프라 최소화
3. **타입 안전성**: TypeScript/Pydantic으로 타입 검증
4. **개발자 경험**: Hot reload, 자동 API 문서

---

## 고수준 아키텍처

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Client Layer (Browser)                         │
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────────────┐ │
│  │   Home Page    │  │   Dashboard    │  │      History Page       │ │
│  │                │  │                │  │                         │ │
│  │ - StockInput   │  │ - AnalysisForm │  │ - AnalysisHistory       │ │
│  │ - Timeframe    │  │ - AnalysisResult│ │ - Filters               │ │
│  └────────┬───────┘  └───────┬────────┘  └────────────┬────────────┘ │
│           │                  │                        │              │
└───────────┼──────────────────┼────────────────────────┼──────────────┘
            │                  │                        │
            │      REST API    │                        │
            │                  │                        │
┌───────────┼──────────────────┼────────────────────────┼──────────────┐
│           │    FastAPI Backend                        │              │
│           │                  │                        │              │
│  ┌────────▼──────────────────▼────────────────────────▼────────────┐ │
│  │                     API Routers                                  │ │
│  │  ┌──────────────────┐    ┌──────────────────────────────────┐   │ │
│  │  │  Analysis Router │    │         Payment Router           │   │ │
│  │  │                  │    │                                  │   │ │
│  │  │ POST /stock      │    │ POST /checkout                   │   │ │
│  │  │ GET  /latest     │    │ GET  /checkout/{id}/status       │   │ │
│  │  │ GET  /history    │    │ GET  /checkout/{id}/verify       │   │ │
│  │  │ GET  /{id}       │    │                                  │   │ │
│  │  │ GET  /search     │    │                                  │   │ │
│  │  └────────┬─────────┘    └────────────────┬─────────────────┘   │ │
│  └───────────┼───────────────────────────────┼─────────────────────┘ │
│              │                               │                       │
│  ┌───────────▼───────────────────────────────▼─────────────────────┐ │
│  │                      Services Layer                              │ │
│  │                                                                  │ │
│  │  ┌───────────────────────┐   ┌────────────────────────────────┐ │ │
│  │  │  StockInsightEngine   │   │      PaymentService            │ │ │
│  │  │                       │   │                                │ │ │
│  │  │  - AI 분석 생성       │   │  - Lemon Squeezy 결제 연동     │ │ │
│  │  │  - LLM API 호출       │   │  - 체크아웃 생성               │ │ │
│  │  │  - 폴백 지원          │   │  - 환불 처리                   │ │ │
│  │  └───────────┬───────────┘   └────────────────────────────────┘ │ │
│  │              │                                                   │ │
│  │  ┌───────────▼───────────┐   ┌────────────────────────────────┐ │ │
│  │  │  StockDataService     │   │      ResponseParser            │ │ │
│  │  │                       │   │                                │ │ │
│  │  │  - Finnhub (US)       │   │  - JSON 파싱                   │ │ │
│  │  │  - yfinance (KR)      │   │  - 데이터 검증                 │ │ │
│  │  │  - 캐싱 (5분)         │   │                                │ │ │
│  │  └───────────────────────┘   └────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                      │                               │
│  ┌───────────────────────────────────▼───────────────────────────┐   │
│  │                         SQLite Database                        │   │
│  │                                                                │   │
│  │  stock_insights table:                                         │   │
│  │  - 분석 결과 저장                                              │   │
│  │  - 히스토리 조회                                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
      │  OpenAI API  │ │ Finnhub API  │ │ Lemon Squeezy API│
      │              │ │              │ │                  │
      │  GPT-4o-mini │ │  US Stocks   │ │    Payment       │
      └──────────────┘ └──────────────┘ └──────────────────┘
              │
              ▼
      ┌──────────────┐
      │Anthropic API │ (Fallback)
      │              │
      │  Claude 3.5  │
      └──────────────┘
```

---

## 기술 스택

### Frontend

| 기술 | 버전 | 용도 |
|------|------|------|
| Next.js | 15 | React 프레임워크 (App Router) |
| React | 19 | UI 라이브러리 |
| TypeScript | - | 타입 안전성 |
| Tailwind CSS | 4 | 스타일링 |
| shadcn/ui | - | UI 컴포넌트 |
| Zustand | - | 상태 관리 |
| lucide-react | - | 아이콘 |

### Backend

| 기술 | 용도 |
|------|------|
| Python 3.10+ | 런타임 |
| FastAPI | 웹 프레임워크 (Async) |
| SQLAlchemy | ORM (Async) |
| SQLite | 데이터베이스 |
| Pydantic | 데이터 검증 |
| httpx | HTTP 클라이언트 |
| yfinance | 한국 주식 데이터 |

### External APIs

| API | 용도 |
|-----|------|
| OpenAI | GPT-4o-mini (Primary) |
| Anthropic | Claude 3.5 (Fallback) |
| Finnhub | 미국 주식 데이터 |
| Yahoo Finance | 한국 주식 데이터 |
| Lemon Squeezy | 결제 처리 |

---

## 컴포넌트 다이어그램

### Frontend 컴포넌트

```
App
├── ThemeProvider
├── MainLayout
│   ├── TopNav
│   │   └── ThemeToggle
│   ├── {children}
│   └── Disclaimer
│
├── Home Page (/)
│   ├── AnalysisForm
│   │   ├── StockInput
│   │   └── TimeframePicker
│   └── AnalysisResult
│       ├── RecommendationBadge
│       ├── RiskGauge
│       └── SectionCard[]
│
├── Dashboard (/dashboard)
│   └── (Same as Home)
│
├── History (/history)
│   └── AnalysisHistory
│
└── Analysis Detail (/analysis/[id])
    └── AnalysisResult
```

### Backend 컴포넌트

```
FastAPI Application
├── main.py (Entry Point)
│   └── lifespan (init_db)
│
├── Routers
│   ├── analysis.py (/api/analysis)
│   └── payment.py (/api/payment)
│
├── Services
│   ├── stock_insight_engine.py
│   ├── stock_data_service.py
│   ├── payment_service.py
│   ├── prompts.py
│   └── response_parser.py
│
├── Models
│   └── stock_insight.py (StockInsight)
│
├── Schemas
│   └── analysis.py (Pydantic Models)
│
└── Core
    ├── config.py (Settings)
    └── database.py (SQLAlchemy)
```

---

## 데이터베이스 스키마

### stock_insights

```sql
CREATE TABLE stock_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- 종목 정보
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    market VARCHAR(10) NOT NULL,
    timeframe VARCHAR(20) NOT NULL,

    -- 딥리서치 분석
    deep_research TEXT NOT NULL,

    -- 투자 의사결정
    recommendation VARCHAR(20) NOT NULL,
    confidence_level VARCHAR(20) NOT NULL,
    recommendation_reason TEXT,

    -- 위험도 평가
    risk_score INTEGER NOT NULL,
    risk_analysis JSON,

    -- 시장 현황
    current_price REAL,
    price_change_1d REAL,
    price_change_1w REAL,
    price_change_1m REAL,
    market_overview JSON,

    -- 시장 심리
    market_sentiment VARCHAR(20),
    sentiment_details JSON,

    -- 분석 요약
    key_summary JSON,
    current_drivers JSON,

    -- 미래 촉매
    future_catalysts JSON,

    -- 메타데이터
    ai_model VARCHAR(50),
    processing_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stock_code ON stock_insights(stock_code);
```

---

## 보안

### 현재 구현

- **입력 검증**: Pydantic 모델
- **SQL 인젝션 방지**: SQLAlchemy ORM
- **CORS**: 설정된 origin만 허용
- **SSL 비활성화**: 회사 네트워크 환경 대응

### 환경 변수

민감 정보는 환경 변수로 관리:

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
FINNHUB_API=...
POLAR_ACCESS_TOKEN=...
```

---

## 확장성

### 현재 한계

- 단일 서버 인스턴스
- SQLite 단일 파일
- 메모리 캐시

### 향후 확장 가능

- PostgreSQL 마이그레이션
- Redis 캐시
- 수평 확장 (Load Balancer)
- 백그라운드 작업 (Celery)

---

## 관련 문서

- [AI 파이프라인](./AI_PIPELINE.md) - 분석 엔진 상세
- [데이터 흐름](./DATA_FLOW.md) - 요청-응답 플로우
- [백엔드 서비스](../backend/SERVICES.md) - 서비스 계층
- [데이터 모델](../backend/MODELS.md) - DB 스키마
