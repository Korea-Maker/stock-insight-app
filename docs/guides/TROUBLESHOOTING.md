# 트러블슈팅 가이드

> **최종 업데이트:** 2025-01-28

Stock Insight App 일반적인 오류 및 해결 방법입니다.

## 에러 코드 표

| 상태 코드 | 에러 | 원인 | 해결 방법 |
|-----------|------|------|----------|
| 400 | Bad Request | 잘못된 요청 형식, X-User-Id 누락/잘못됨 | 요청 파라미터 및 헤더 확인 |
| 402 | Payment Required | 결제가 필요한 요청 | Lemon Squeezy 결제 완료 후 재시도 |
| 404 | Not Found | 종목/분석 결과를 찾을 수 없음 | 종목코드 확인, 다른 사용자 데이터 접근 시도 |
| 500 | Internal Server Error | 서버 내부 오류 | 로그 확인, API 키 설정 확인 |
| 503 | Service Unavailable | 외부 API 장애 (OpenAI, Finnhub) | 잠시 후 재시도 |

---

## 일반 오류

### API 키 오류

**증상:**
```
OPENAI_API_KEY가 설정되지 않았습니다
```

**원인:**
- `.env` 파일이 없거나 API 키가 누락됨

**해결:**
```bash
cd backend

# .env 파일 확인
cat .env

# 없으면 생성
cp env.example .env

# 편집
# OPENAI_API_KEY=sk-...
# FINNHUB_API=your_key
```

---

### SSL 인증서 오류

**증상:**
```
SSL: CERTIFICATE_VERIFY_FAILED
```

**원인:**
- 회사/학교 네트워크에서 SSL 인증서 검증 실패
- 프록시 서버 설정

**해결:**
코드에서 이미 `verify=False` 처리되어 있습니다. 문제가 지속되면:

```python
# backend/app/core/config.py
import ssl
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
```

---

### 포트 충돌

**증상:**
```
Address already in use
Port 8000 is already in use
```

**원인:**
- 다른 프로세스가 포트를 사용 중

**해결:**

```bash
# macOS/Linux: 포트 사용 프로세스 확인
lsof -i :8000
kill -9 <PID>

# Windows: 포트 사용 프로세스 확인
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

또는 다른 포트 사용:
```bash
# backend/.env
API_PORT=8001
```

---

### 모듈 없음 오류

**증상:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**원인:**
- 가상환경 비활성화 상태
- 의존성 미설치

**해결:**
```bash
cd backend

# 가상환경 활성화
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# 의존성 설치
pip install -r requirements.txt
```

---

### 데이터베이스 오류

**증상:**
```
sqlite3.OperationalError: no such table: stock_insights
```

**원인:**
- 데이터베이스 파일 손상 또는 스키마 변경

**해결:**
```bash
# 데이터베이스 재생성
rm backend/stock_insights.db

# 서버 재시작 (자동 생성)
cd backend
python main.py
```

---

### CORS 오류

**증상:**
```
Access to fetch at 'http://localhost:8000' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**원인:**
- CORS 설정 누락

**해결:**

```bash
# backend/.env
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

개발 중 모든 오리진 허용 (프로덕션에서는 사용하지 마세요):
```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## API 관련 오류

### 종목을 찾을 수 없음 (404)

**증상:**
```json
{
  "detail": "종목을 찾을 수 없습니다"
}
```

**원인:**
- 잘못된 종목코드
- 지원하지 않는 시장

**해결:**
- 종목코드 확인: `AAPL` (O), `APPLE` (X)
- 한국 종목: `005930.KS` 또는 `삼성전자`
- 지원 시장: US (Finnhub), KR (yfinance)

```bash
# 종목 검색으로 확인
curl "http://localhost:8000/api/analysis/search/stock?query=삼성"
```

---

### X-User-Id 오류 (400)

**증상:**
```json
{
  "detail": "X-User-Id 헤더가 필요합니다"
}
```
또는
```json
{
  "detail": "유효한 UUID 형식의 User ID가 필요합니다"
}
```

**원인:**
- 헤더 누락
- UUID 형식이 아닌 값

**해결:**
```bash
# 올바른 형식
curl http://localhost:8000/api/analysis/history \
  -H "X-User-Id: 550e8400-e29b-41d4-a716-446655440000"
```

Frontend에서는 `lib/utils/userId.ts`의 `getUserId()` 함수가 자동으로 처리합니다.

---

### 결제 필요 (402)

**증상:**
```json
{
  "detail": "결제가 필요합니다"
}
```

**원인:**
- Lemon Squeezy 결제가 설정되어 있고 무료 분석 횟수 초과

**해결:**
- 결제 진행 후 `checkout_id` 포함하여 재요청
- 또는 데모 모드 활성화:

```bash
# backend/.env
DEMO_MODE=true
```

---

### AI 분석 실패 (500)

**증상:**
```json
{
  "detail": "AI 분석 중 오류가 발생했습니다"
}
```

**원인:**
- OpenAI/Anthropic API 키 무효
- API 호출 제한 초과
- 네트워크 오류

**해결:**
1. API 키 확인:
```bash
# OpenAI 키 테스트
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

2. 로그 확인:
```bash
# 서버 로그에서 상세 에러 확인
tail -f backend/logs/app.log
```

3. 폴백 설정 확인:
```bash
# Anthropic을 폴백으로 설정
# backend/.env
ANTHROPIC_API_KEY=sk-ant-...
```

---

### 서비스 불가 (503)

**증상:**
```json
{
  "detail": "외부 API 서비스 일시 장애"
}
```

**원인:**
- Finnhub API 장애
- OpenAI/Anthropic 서비스 장애

**해결:**
- 잠시 후 재시도 (1-5분)
- 외부 서비스 상태 확인:
  - [Finnhub Status](https://finnhub.io)
  - [OpenAI Status](https://status.openai.com)
  - [Anthropic Status](https://status.anthropic.com)

---

## Frontend 오류

### 빈 화면 / 하이드레이션 오류

**증상:**
- 페이지가 비어있거나 깜빡임
- 콘솔에 "Hydration failed" 에러

**원인:**
- 서버/클라이언트 렌더링 불일치
- localStorage 접근 (SSR 환경)

**해결:**
`use client` 지시문 확인:
```typescript
'use client';

import { useEffect, useState } from 'react';

export function MyComponent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // localStorage 접근
  const userId = localStorage.getItem('stock_insight_user_id');
  // ...
}
```

---

### 네트워크 요청 실패

**증상:**
```
TypeError: Failed to fetch
```

**원인:**
- 백엔드 서버 미실행
- 잘못된 API URL

**해결:**
1. 백엔드 실행 확인:
```bash
curl http://localhost:8000/health
```

2. 환경 변수 확인:
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### 빌드 실패

**증상:**
```
Type error: Cannot find module '@/components/...'
```

**원인:**
- 타입 에러
- 경로 별칭 설정 오류

**해결:**
```bash
cd frontend

# 타입 체크
npx tsc --noEmit

# 의존성 재설치
rm -rf node_modules .next
npm install
npm run build
```

---

## 디버깅 팁

### 백엔드 로그 레벨 변경

```python
# main.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

### 네트워크 요청 추적

```bash
# 모든 API 요청 로깅
export HTTPX_LOG_LEVEL=debug
python main.py
```

### Frontend 디버그 모드

```bash
# 개발 서버 실행
npm run dev

# 브라우저 개발자 도구에서:
# - Network 탭: API 요청 확인
# - Console: 에러 메시지
# - Application > Local Storage: userId 확인
```

### 데이터베이스 직접 조회

```bash
# SQLite CLI
sqlite3 backend/stock_insights.db

# 테이블 확인
.tables

# 최근 분석 확인
SELECT id, stock_code, user_id, created_at
FROM stock_insights
ORDER BY created_at DESC
LIMIT 5;

# 종료
.quit
```

---

## 도움 요청

문제가 해결되지 않으면:

1. **GitHub Issues**: [프로젝트 Issues 페이지](https://github.com/your-org/stock-insight-app/issues)
2. **에러 재현 정보 포함**:
   - 에러 메시지 전문
   - 실행 환경 (OS, Python/Node 버전)
   - 재현 단계

---

## 관련 문서

- [개발 가이드](./DEVELOPMENT.md) - 로컬 환경 설정
- [테스트 가이드](./TESTING.md) - 테스트 실행
- [배포 가이드](./DEPLOYMENT.md) - 프로덕션 배포
- [API 인증](../api/AUTHENTICATION.md) - X-User-Id 헤더
