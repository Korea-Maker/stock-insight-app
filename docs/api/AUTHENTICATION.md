# API 인증

> **최종 업데이트:** 2025-01-28

Stock Insight App API 인증 방식에 대한 문서입니다.

## 개요

Stock Insight App은 **Browser UUID 기반 사용자 식별** 방식을 사용합니다.

- localStorage에 UUID v4 저장
- API 요청 시 `X-User-Id` 헤더로 전송
- 서버에서 user_id별 데이터 필터링

---

## X-User-Id 헤더

### 형식

```
X-User-Id: <UUID v4>
```

**예시:**
```
X-User-Id: 550e8400-e29b-41d4-a716-446655440000
```

### UUID v4 규격

- 36자 (하이픈 포함)
- 형식: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
- `x`: 0-9, a-f (16진수)
- `y`: 8, 9, a, b 중 하나

**정규표현식:**
```regex
^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$
```

---

## 엔드포인트별 인증 요구사항

| 엔드포인트 | X-User-Id | 설명 |
|-----------|-----------|------|
| `POST /api/analysis/stock` | **필수** | 분석 생성 시 user_id 저장 |
| `GET /api/analysis/latest` | **필수** | 본인 데이터만 조회 |
| `GET /api/analysis/history` | **필수** | 본인 데이터만 조회 |
| `GET /api/analysis/{id}` | **필수** | 소유권 검증 |
| `GET /api/analysis/search/stock` | 불필요 | 종목 검색 (공개 데이터) |
| `POST /api/payment/*` | 불필요 | 결제 흐름 |
| `GET /health` | 불필요 | 헬스 체크 |

---

## Frontend 구현

### UUID 유틸리티

**파일:** `frontend/lib/utils/userId.ts`

```typescript
const USER_ID_KEY = 'stock_insight_user_id';

/**
 * 사용자 ID 조회 (없으면 생성)
 */
export function getUserId(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, userId);
  }

  return userId;
}

/**
 * 사용자 ID 초기화 (디버깅/테스트용)
 */
export function resetUserId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_ID_KEY);
}
```

### API 클라이언트

**파일:** `frontend/lib/api/analysis.ts`

```typescript
import { getUserId } from '../utils/userId';

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
  };
}

// 모든 인증 필요 API 호출에서 사용
export async function analyzeStock(request: AnalysisRequest) {
  const response = await fetch(`${API_BASE_URL}/api/analysis/stock`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });
  // ...
}
```

---

## 에러 응답

### 400 Bad Request - 헤더 누락

```json
{
  "detail": "X-User-Id 헤더가 필요합니다"
}
```

**원인:** 필수 엔드포인트에서 `X-User-Id` 헤더가 없는 경우

### 400 Bad Request - 유효하지 않은 형식

```json
{
  "detail": "유효한 UUID 형식의 User ID가 필요합니다"
}
```

**원인:** UUID v4 형식이 아닌 값이 전송된 경우

### 404 Not Found - 소유권 없음

```json
{
  "detail": "분석 결과를 찾을 수 없습니다"
}
```

**원인:** 다른 사용자의 분석 결과에 접근 시도

---

## curl 테스트

### 분석 생성

```bash
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -H "X-User-Id: aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" \
  -d '{"stock_code": "AAPL", "timeframe": "mid"}'
```

### 히스토리 조회

```bash
curl http://localhost:8000/api/analysis/history \
  -H "X-User-Id: aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
```

### 분석 상세 조회

```bash
curl http://localhost:8000/api/analysis/1 \
  -H "X-User-Id: aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"
```

### 격리 테스트

```bash
# 사용자 A로 분석 생성
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -H "X-User-Id: aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" \
  -d '{"stock_code": "AAPL", "timeframe": "mid"}'

# 사용자 B로 히스토리 조회 (빈 결과)
curl http://localhost:8000/api/analysis/history \
  -H "X-User-Id: bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"
# 결과: {"total": 0, "items": []}

# 사용자 B가 사용자 A의 분석 접근 시도 (404)
curl http://localhost:8000/api/analysis/1 \
  -H "X-User-Id: bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"
# 결과: 404 Not Found
```

---

## 보안 고려사항

### 현재 방식의 특성

| 항목 | 설명 |
|------|------|
| 인증 수준 | 낮음 (세션 식별 목적) |
| 기기 간 동기화 | 불가능 (브라우저별 격리) |
| UUID 추측 가능성 | 매우 낮음 (2^122 경우의 수) |
| 데이터 민감도 | 주식 분석 히스토리 (개인 재무 정보 없음) |

### 위협 대응

| 위협 | 대응 |
|------|------|
| UUID 스푸핑 | UUID는 추측 불가능, 개인 데이터 가치 낮음 |
| XSS 공격 | Next.js 기본 XSS 방어, Content Security Policy |
| CORS 우회 | 허용된 Origin만 접근 가능 |

---

## 향후 확장

OAuth 마이그레이션이 필요한 경우:

1. `users` 테이블 추가
2. OAuth 로그인 시 localStorage UUID를 계정에 연결
3. 기존 UUID 기반 데이터를 OAuth 계정으로 마이그레이션
4. 여러 기기에서 동일 계정으로 접근 가능

---

## 관련 문서

- [분석 API](./ANALYSIS_API.md) - API 엔드포인트 상세
- [사용자 격리 설계](../architecture/user-isolation-design.md) - 아키텍처 설계서
- [개발 가이드](../guides/DEVELOPMENT.md) - 로컬 환경 설정
