# Development Guide

Stock Insight App 로컬 개발 환경 설정 및 개발 가이드입니다.

## 사전 요구사항

- **Node.js** 18+
- **Python** 3.10+
- **Git**

> **Note:** Docker 불필요 - SQLite 사용

## 환경 설정

### 1. 저장소 클론

```bash
git clone <repository-url>
cd stock-insight-app
```

### 2. 백엔드 설정

```bash
cd backend

# 가상환경 생성
python -m venv venv

# 활성화
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 설정
cp env.example .env
# .env 파일 편집하여 API 키 설정
```

### 3. 프론트엔드 설정

```bash
cd frontend
npm install
```

## 환경 변수

### Backend (`backend/.env`)

```bash
# 필수: OpenAI API 키
OPENAI_API_KEY=sk-...

# 필수: Finnhub API 키
FINNHUB_API=your_finnhub_api_key

# 선택: Anthropic API 키 (폴백)
ANTHROPIC_API_KEY=sk-ant-...

# 선택: Lemon Squeezy 결제
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_VARIANT_ID=your_variant_id

# 설정
LLM_PRIMARY_PROVIDER=openai
API_PORT=8000
```

## 개발 서버 실행

### 백엔드

```bash
cd backend
venv\Scripts\activate  # Windows
python main.py
```

서버: `http://localhost:8000`

### 프론트엔드

```bash
cd frontend
npm run dev
```

서버: `http://localhost:3000`

## 프로젝트 구조

### Backend

```
backend/
├── main.py                     # FastAPI 진입점
├── app/
│   ├── core/
│   │   ├── config.py           # Pydantic Settings
│   │   └── database.py         # SQLAlchemy (SQLite)
│   ├── models/
│   │   └── stock_insight.py    # StockInsight 모델
│   ├── routers/
│   │   ├── analysis.py         # 분석 API
│   │   └── payment.py          # 결제 API
│   ├── schemas/
│   │   └── analysis.py         # Pydantic 스키마
│   └── services/
│       ├── stock_insight_engine.py  # AI 분석 엔진
│       ├── stock_data_service.py    # 주식 데이터 서비스
│       ├── payment_service.py       # 결제 서비스
│       ├── prompts.py               # LLM 프롬프트
│       └── response_parser.py       # 응답 파싱
└── stock_insights.db           # SQLite 데이터베이스 (자동 생성)
```

### Frontend

```
frontend/
├── app/                        # Next.js App Router
│   ├── page.tsx
│   ├── dashboard/page.tsx
│   ├── history/page.tsx
│   └── analysis/[id]/page.tsx
├── components/
│   ├── Analysis/               # 분석 컴포넌트
│   ├── Stock/                  # 종목 입력 컴포넌트
│   ├── Layout/                 # 레이아웃
│   ├── Navigation/             # 네비게이션
│   ├── Theme/                  # 테마
│   ├── Legal/                  # 법적 고지
│   └── ui/                     # shadcn/ui
├── store/
│   └── useAnalysisStore.ts     # Zustand 스토어
├── lib/
│   └── api/analysis.ts         # API 클라이언트
└── types/
    └── stock.ts                # 타입 정의
```

## 코딩 표준

### Python (Backend)

- **PEP 8** 준수
- **Type hints** 필수
- **Pydantic** 모델로 검증
- **async/await** 사용

```python
async def get_stock_data(
    symbol: str,
    timeframe: str = "mid"
) -> Optional[StockData]:
    """주식 데이터 조회"""
    # ...
```

### TypeScript (Frontend)

- **TypeScript strict** 모드
- **함수형 컴포넌트** 선호
- **서버 컴포넌트** 우선 (use client 최소화)
- **Zustand** 상태 관리

```typescript
interface Props {
  stockCode: string
}

export function StockCard({ stockCode }: Props) {
  // ...
}
```

## API 테스트

### curl

```bash
# 헬스 체크
curl http://localhost:8000/health

# 분석 요청
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -d '{"stock_code": "AAPL", "timeframe": "mid"}'

# 분석 결과 조회
curl http://localhost:8000/api/analysis/1

# 분석 히스토리
curl http://localhost:8000/api/analysis/history

# 종목 검색
curl "http://localhost:8000/api/analysis/search/stock?query=apple"
```

### Swagger UI

`http://localhost:8000/docs` 접속

## 데이터베이스

SQLite를 사용하며 `backend/stock_insights.db` 파일이 자동 생성됩니다.

### 초기화

데이터베이스를 초기화하려면:

```bash
rm backend/stock_insights.db
```

서버 재시작 시 테이블이 자동 생성됩니다.

## 문제 해결

### SSL 인증서 오류

회사 네트워크 환경에서 발생할 수 있습니다. 코드에서 이미 `verify=False`로 처리되어 있습니다.

### API 키 오류

```
OPENAI_API_KEY가 설정되지 않았습니다
```

`.env` 파일에 API 키가 올바르게 설정되었는지 확인하세요.

### 포트 충돌

```bash
# 8000 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :8000

# 프로세스 종료
taskkill /PID <PID> /F
```

### 모듈 없음 오류

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## 커밋 메시지 규칙

```
<type>: <description>

Types:
- feat: 새 기능
- fix: 버그 수정
- refactor: 리팩토링
- docs: 문서
- test: 테스트
- chore: 빌드/설정

예시:
feat: 종목 검색 자동완성 추가
fix: 분석 결과 null 처리 수정
docs: API 문서 업데이트
```

## 추가 리소스

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [Next.js 문서](https://nextjs.org/docs)
- [Zustand 문서](https://docs.pmnd.rs/zustand)
- [SQLAlchemy 문서](https://docs.sqlalchemy.org/)
