# Stock Insight Backend

Stock Insight App의 FastAPI 백엔드입니다.

## 기술 스택

- **Python** 3.10+
- **FastAPI** (Async)
- **SQLAlchemy** (Async) + SQLite
- **OpenAI** GPT-4o-mini
- **Anthropic** Claude (Fallback)
- **Finnhub** API (US Stocks)
- **yfinance** (KR Stocks)
- **Polar** (Payment)

## 빠른 시작

### 1. 가상환경 설정

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. 의존성 설치

```bash
pip install -r requirements.txt
```

### 3. 환경 변수 설정

`.env` 파일 생성:

```bash
# 필수
OPENAI_API_KEY=sk-...
FINNHUB_API=your_finnhub_api_key

# 선택 (폴백)
ANTHROPIC_API_KEY=sk-ant-...

# 선택 (결제)
POLAR_ACCESS_TOKEN=your_polar_token
POLAR_PRODUCT_ID=your_product_id

# 설정
LLM_PRIMARY_PROVIDER=openai
API_PORT=8000
```

### 4. 서버 실행

```bash
python main.py
```

서버: `http://localhost:8000`

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/health` | 헬스 체크 |
| POST | `/api/analysis/stock` | 주식 분석 실행 |
| GET | `/api/analysis/latest` | 최신 분석 조회 |
| GET | `/api/analysis/history` | 분석 히스토리 |
| GET | `/api/analysis/search/stock` | 종목 검색 |
| GET | `/api/analysis/{id}` | 분석 상세 조회 |
| POST | `/api/payment/checkout` | 결제 세션 생성 |
| GET | `/api/payment/checkout/{id}/status` | 결제 상태 조회 |
| GET | `/api/payment/checkout/{id}/verify` | 결제 검증 |

## API 문서

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 데이터베이스

SQLite를 사용하며 `stock_insights.db` 파일이 자동 생성됩니다.

### 초기화

```bash
rm stock_insights.db
```

## 프로젝트 구조

```
backend/
├── main.py                     # FastAPI 진입점
├── app/
│   ├── core/
│   │   ├── config.py           # 환경 설정
│   │   └── database.py         # DB 연결
│   ├── models/
│   │   └── stock_insight.py    # 데이터 모델
│   ├── routers/
│   │   ├── analysis.py         # 분석 API
│   │   └── payment.py          # 결제 API
│   ├── schemas/
│   │   └── analysis.py         # Pydantic 스키마
│   └── services/
│       ├── stock_insight_engine.py  # AI 분석 엔진
│       ├── stock_data_service.py    # 주식 데이터
│       ├── payment_service.py       # 결제 서비스
│       ├── prompts.py               # LLM 프롬프트
│       └── response_parser.py       # 응답 파싱
└── requirements.txt
```

## 지원 시장

| 시장 | 데이터 소스 | 예시 |
|------|-------------|------|
| US | Finnhub API | AAPL, GOOGL, MSFT |
| KR | yfinance | 삼성전자, 005930.KS |

## 문제 해결

### SSL 인증서 오류

회사 네트워크 환경에서 `verify=False`가 이미 적용되어 있습니다.

### API 키 미설정

```
OPENAI_API_KEY가 설정되지 않았습니다
```

`.env` 파일에 API 키를 올바르게 설정하세요.
