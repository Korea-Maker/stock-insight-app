# Stock Insight App 문서

AI 기반 주식 딥리서치 분석 애플리케이션의 기술 문서입니다.

## 문서 구조

```
docs/
├── README.md                    # 이 파일
├── GETTING_STARTED.md           # 5분 퀵스타트 가이드
├── api/                         # API 문서
│   ├── ANALYSIS_API.md          # 분석 API 엔드포인트
│   └── PAYMENT_API.md           # 결제 API 엔드포인트
├── architecture/                # 아키텍처 문서
│   ├── SYSTEM_OVERVIEW.md       # 시스템 아키텍처 개요
│   ├── AI_PIPELINE.md           # AI 분석 파이프라인
│   └── DATA_FLOW.md             # 데이터 흐름도
├── backend/                     # 백엔드 문서
│   ├── SERVICES.md              # 서비스 계층 상세
│   └── MODELS.md                # 데이터 모델 정의
├── frontend/                    # 프론트엔드 문서
│   ├── COMPONENTS.md            # 컴포넌트 구조
│   └── STORES.md                # 상태 관리 (Zustand)
└── guides/                      # 개발 가이드
    └── DEVELOPMENT.md           # 로컬 개발 환경 설정
```

## 빠른 링크

### 시작하기
- [5분 퀵스타트](./GETTING_STARTED.md) - 환경 설정 및 실행

### API 레퍼런스
- [분석 API](./api/ANALYSIS_API.md) - 주식 분석 API
- [결제 API](./api/PAYMENT_API.md) - Polar 결제 연동

### 아키텍처
- [시스템 개요](./architecture/SYSTEM_OVERVIEW.md) - 전체 시스템 구조
- [AI 파이프라인](./architecture/AI_PIPELINE.md) - 분석 엔진 상세
- [데이터 흐름](./architecture/DATA_FLOW.md) - 요청-응답 플로우

### 코드 문서
- [백엔드 서비스](./backend/SERVICES.md) - Python 서비스 계층
- [데이터 모델](./backend/MODELS.md) - SQLAlchemy 모델
- [프론트엔드 컴포넌트](./frontend/COMPONENTS.md) - React 컴포넌트
- [상태 관리](./frontend/STORES.md) - Zustand 스토어

### 개발
- [개발 가이드](./guides/DEVELOPMENT.md) - 로컬 환경 설정

## 기술 스택 요약

| 계층 | 기술 |
|------|------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4, shadcn/ui |
| State | Zustand |
| Backend | Python FastAPI (Async), SQLAlchemy |
| Database | SQLite |
| AI | OpenAI GPT-4o-mini, Anthropic Claude (fallback) |
| Stock Data | Finnhub API (US), yfinance (KR) |
| Payment | Polar |

## 지원 시장

| 시장 | 지원 | 데이터 소스 |
|------|------|-------------|
| US | ✅ | Finnhub API |
| KR | ✅ | yfinance (Yahoo Finance) |
