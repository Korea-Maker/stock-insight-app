# Stock Insight App 퀵스타트 가이드

5분 안에 로컬 환경에서 Stock Insight App을 실행하는 방법입니다.

## 사전 요구사항

- **Node.js** 18+ (프론트엔드)
- **Python** 3.10+ (백엔드)
- **Git**

## 1. 저장소 클론

```bash
git clone <repository-url>
cd stock-insight-app
```

## 2. 백엔드 설정

### 2.1 가상환경 생성 및 활성화

```bash
cd backend

# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python -m venv venv
source venv/bin/activate
```

### 2.2 의존성 설치

```bash
pip install -r requirements.txt
```

### 2.3 환경 변수 설정

`.env` 파일 생성:

```bash
# backend/.env

# 필수: OpenAI API 키
OPENAI_API_KEY=sk-...

# 필수: Finnhub API 키 (https://finnhub.io에서 무료 발급)
FINNHUB_API=your_finnhub_api_key

# 선택: Anthropic API 키 (폴백용)
ANTHROPIC_API_KEY=sk-ant-...

# 선택: Polar 결제 (결제 기능 사용 시)
POLAR_ACCESS_TOKEN=your_polar_token
POLAR_PRODUCT_ID=your_product_id

# 설정
LLM_PRIMARY_PROVIDER=openai
API_PORT=8000
```

### 2.4 백엔드 서버 실행

```bash
python main.py
```

서버가 `http://localhost:8000`에서 실행됩니다.

**헬스 체크:**
```bash
curl http://localhost:8000/health
```

## 3. 프론트엔드 설정

새 터미널을 열고:

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## 4. 첫 번째 분석 실행

### 웹 UI 사용
1. http://localhost:3000 접속
2. 종목코드 입력 (예: AAPL, TSLA, 삼성전자)
3. 투자 기간 선택 (단기/중기/장기)
4. "분석 시작" 클릭

### API 직접 호출
```bash
# 분석 요청
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -d '{"stock_code": "AAPL", "timeframe": "mid"}'

# 응답 예시
{
  "message": "분석이 성공적으로 완료되었습니다",
  "insight_id": 1,
  "stock_code": "AAPL",
  "stock_name": "Apple Inc.",
  "recommendation": "buy"
}
```

## 5. 문제 해결

### SSL 인증서 오류
회사 네트워크 환경에서 SSL 검증 오류 발생 시, 코드에서 이미 `verify=False` 설정이 적용되어 있습니다.

### API 키 오류
```
OPENAI_API_KEY가 설정되지 않았습니다
```
→ `.env` 파일에 API 키가 올바르게 설정되었는지 확인

### 종목을 찾을 수 없음
- US 종목: 대문자 심볼 사용 (예: AAPL, GOOGL)
- KR 종목: 한글명 또는 코드.KS 형식 (예: 삼성전자, 005930.KS)

### 데이터베이스
SQLite를 사용하며 `backend/stock_insights.db` 파일이 자동 생성됩니다.
초기화가 필요하면 해당 파일을 삭제하세요.

## 다음 단계

- [API 문서](./api/ANALYSIS_API.md) - 전체 API 엔드포인트
- [시스템 아키텍처](./architecture/SYSTEM_OVERVIEW.md) - 시스템 구조 이해
- [개발 가이드](./guides/DEVELOPMENT.md) - 상세 개발 환경 설정
