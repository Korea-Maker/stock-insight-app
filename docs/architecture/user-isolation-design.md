# 사용자별 히스토리 격리 - 아키텍처 설계서

## 1. 개요

### 1.1 목표
분석 보고서를 생성한 사용자만 해당 히스토리를 조회할 수 있도록 데이터 격리 구현

### 1.2 선택된 방식
**Browser UUID 기반 사용자 식별**
- localStorage에 UUID v4 저장
- API 요청 시 `X-User-Id` 헤더로 전송
- 서버에서 user_id별 데이터 필터링

### 1.3 제약 조건
- 기기 간 동기화 불필요 (동일 브라우저에서만 조회)
- 기존 데이터 삭제 후 시작
- 최소 리소스로 구현

---

## 2. 시스템 아키텍처

### 2.1 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   userId.ts      │    │   analysis.ts    │                       │
│  │   (NEW)          │───▶│   (API Client)   │                       │
│  │                  │    │                  │                       │
│  │ • getUserId()    │    │ • analyzeStock() │                       │
│  │ • localStorage   │    │ • getHistory()   │                       │
│  └──────────────────┘    │ • getById()      │                       │
│         │                └────────┬─────────┘                       │
│         │                         │                                  │
│         │    ┌────────────────────┼────────────────────┐            │
│         │    │     X-User-Id      │     Header         │            │
│         └────┴────────────────────┴────────────────────┘            │
│                                   │                                  │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │ HTTP Request
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Backend (FastAPI)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │   analysis.py    │    │   get_user_id()  │                       │
│  │   (Router)       │◀───│   (Dependency)   │                       │
│  │                  │    │                  │                       │
│  │ POST /stock      │    │ • Header 추출    │                       │
│  │ GET /history     │    │ • UUID 검증      │                       │
│  │ GET /{id}        │    └──────────────────┘                       │
│  └────────┬─────────┘                                               │
│           │                                                          │
│           ▼                                                          │
│  ┌──────────────────┐    ┌──────────────────┐                       │
│  │ stock_insight_   │    │   StockInsight   │                       │
│  │ engine.py        │───▶│   (Model)        │                       │
│  │                  │    │                  │                       │
│  │ • generate_      │    │ + user_id (NEW)  │                       │
│  │   insight()      │    │ + stock_code     │                       │
│  │   + user_id      │    │ + ...            │                       │
│  └──────────────────┘    └────────┬─────────┘                       │
│                                   │                                  │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────┐
                         │     SQLite       │
                         │   (Database)     │
                         │                  │
                         │ stock_insights   │
                         │ + user_id INDEX  │
                         └──────────────────┘
```

### 2.2 데이터 흐름 (Sequence Diagram)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Browser  │     │ userId.ts│     │analysis.ts│    │ FastAPI  │     │ Database │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ 첫 방문        │                │                │                │
     │───────────────▶│                │                │                │
     │                │ UUID 생성      │                │                │
     │                │ localStorage   │                │                │
     │                │ 저장           │                │                │
     │◀───────────────│                │                │                │
     │                │                │                │                │
     │ 분석 요청      │                │                │                │
     │───────────────▶│                │                │                │
     │                │ getUserId()    │                │                │
     │                │───────────────▶│                │                │
     │                │                │ POST /stock   │                │
     │                │                │ X-User-Id     │                │
     │                │                │───────────────▶│                │
     │                │                │                │ get_user_id() │
     │                │                │                │ Header 추출   │
     │                │                │                │                │
     │                │                │                │ generate_     │
     │                │                │                │ insight()     │
     │                │                │                │ + user_id     │
     │                │                │                │───────────────▶│
     │                │                │                │                │ INSERT
     │                │                │                │                │ user_id
     │                │                │◀───────────────│◀───────────────│
     │◀───────────────│◀───────────────│                │                │
     │                │                │                │                │
     │ 히스토리 조회  │                │                │                │
     │───────────────▶│                │                │                │
     │                │ getUserId()    │                │                │
     │                │───────────────▶│                │                │
     │                │                │ GET /history  │                │
     │                │                │ X-User-Id     │                │
     │                │                │───────────────▶│                │
     │                │                │                │ WHERE         │
     │                │                │                │ user_id = ?   │
     │                │                │                │───────────────▶│
     │                │                │                │                │ SELECT
     │                │                │◀───────────────│◀───────────────│
     │◀───────────────│◀───────────────│ 본인 데이터만 │                │
     │                │                │                │                │
```

---

## 3. 데이터베이스 설계

### 3.1 스키마 변경

**기존 stock_insights 테이블:**
```sql
CREATE TABLE stock_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    market VARCHAR(10) NOT NULL,
    timeframe VARCHAR(20) NOT NULL,
    -- ... 기타 컬럼들 ...
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_stock_insights_stock_code ON stock_insights(stock_code);
```

**변경 후:**
```sql
CREATE TABLE stock_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(36) NOT NULL,  -- 추가
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(100) NOT NULL,
    market VARCHAR(10) NOT NULL,
    timeframe VARCHAR(20) NOT NULL,
    -- ... 기타 컬럼들 ...
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_stock_insights_stock_code ON stock_insights(stock_code);
CREATE INDEX ix_stock_insights_user_id ON stock_insights(user_id);  -- 추가
```

### 3.2 마이그레이션 전략

**선택된 방식: 데이터베이스 재생성**
```bash
# 기존 DB 삭제
del backend\data\quantboard.db

# 서버 재시작 시 새 스키마로 자동 생성
python main.py
```

**이유:**
- 기존 데이터 삭제 결정됨
- SQLAlchemy `create_all()`이 새 스키마 자동 생성
- 복잡한 마이그레이션 스크립트 불필요

---

## 4. API 설계

### 4.1 인증 의존성

```python
# backend/app/routers/analysis.py

from fastapi import Header, HTTPException, Depends
from typing import Annotated
import re

UUID_PATTERN = re.compile(
    r'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$',
    re.IGNORECASE
)

def get_user_id(
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None
) -> str:
    """
    X-User-Id 헤더에서 사용자 ID 추출 및 검증

    Args:
        x_user_id: UUID v4 형식의 사용자 식별자

    Returns:
        검증된 user_id

    Raises:
        HTTPException 400: 유효하지 않은 User ID
    """
    if not x_user_id:
        raise HTTPException(
            status_code=400,
            detail="X-User-Id 헤더가 필요합니다"
        )

    if not UUID_PATTERN.match(x_user_id):
        raise HTTPException(
            status_code=400,
            detail="유효한 UUID 형식의 User ID가 필요합니다"
        )

    return x_user_id
```

### 4.2 엔드포인트 변경

#### POST /api/analysis/stock
```python
@router.post("/stock", response_model=AnalysisTriggerResponse)
async def analyze_stock(
    request: StockAnalysisRequest = Body(...),
    user_id: str = Depends(get_user_id),  # 추가
    db: AsyncSession = Depends(get_db),
):
    # ... 기존 로직 ...

    insight = await stock_insight_engine.generate_insight(
        stock_code=request.stock_code,
        timeframe=request.timeframe.value,
        user_id=user_id  # 추가
    )
```

#### GET /api/analysis/history
```python
@router.get("/history", response_model=StockInsightListResponse)
async def get_analysis_history(
    user_id: str = Depends(get_user_id),  # 추가
    stock_code: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    base_query = select(StockInsight).where(
        StockInsight.user_id == user_id  # 추가
    )
    # ... 기존 로직 ...
```

#### GET /api/analysis/{insight_id}
```python
@router.get("/{insight_id}", response_model=StockInsightResponse)
async def get_analysis_by_id(
    insight_id: int,
    user_id: str = Depends(get_user_id),  # 추가
    db: AsyncSession = Depends(get_db),
):
    query = select(StockInsight).where(
        StockInsight.id == insight_id,
        StockInsight.user_id == user_id  # 추가: 소유권 검증
    )
    # ... 기존 로직 ...
```

### 4.3 영향 받지 않는 엔드포인트

| 엔드포인트 | 이유 |
|-----------|------|
| `GET /api/analysis/latest` | 특정 종목의 최신 분석 조회 - user_id 필터 추가 필요 |
| `GET /api/analysis/search/stock` | 종목 검색 - 사용자 데이터 아님 |
| `POST /api/payment/*` | 결제 관련 - 별도 흐름 |

> **Note:** `GET /api/analysis/latest`도 user_id 필터링 추가 권장

---

## 5. Frontend 설계

### 5.1 UUID 유틸리티

**새 파일: `frontend/lib/utils/userId.ts`**

```typescript
/**
 * 브라우저 기반 사용자 식별자 관리
 * localStorage에 UUID v4를 저장하여 사용자 식별
 */

const USER_ID_KEY = 'stock_insight_user_id';

/**
 * 사용자 ID 조회 (없으면 생성)
 *
 * @returns UUID v4 형식의 사용자 ID
 * @example
 * const userId = getUserId();
 * // "550e8400-e29b-41d4-a716-446655440000"
 */
export function getUserId(): string {
  // SSR 환경 체크
  if (typeof window === 'undefined') {
    return '';
  }

  let userId = localStorage.getItem(USER_ID_KEY);

  if (!userId) {
    // crypto.randomUUID()는 모든 모던 브라우저 지원
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

### 5.2 API 클라이언트 수정

**파일: `frontend/lib/api/analysis.ts`**

```typescript
import { getUserId } from '../utils/userId';

/**
 * 인증 헤더가 포함된 기본 헤더 생성
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
  };
}

// 모든 fetch 호출에서 headers 교체
export async function analyzeStock(...): Promise<...> {
  const response = await fetch(`${API_BASE_URL}/api/analysis/stock`, {
    method: 'POST',
    headers: getHeaders(),  // 변경
    body: JSON.stringify({...}),
  });
  // ...
}

export async function getAnalysisHistory(...): Promise<...> {
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),  // 변경
  });
  // ...
}

export async function getAnalysisById(...): Promise<...> {
  const response = await fetch(`${API_BASE_URL}/api/analysis/${insightId}`, {
    method: 'GET',
    headers: getHeaders(),  // 변경
  });
  // ...
}
```

### 5.3 수정 대상 함수 목록

| 함수명 | 헤더 추가 | 이유 |
|--------|----------|------|
| `analyzeStock()` | ✅ | 분석 생성 시 user_id 저장 |
| `getAnalysisById()` | ✅ | 소유권 검증 |
| `getAnalysisHistory()` | ✅ | 본인 데이터만 조회 |
| `getLatestAnalysis()` | ✅ | 본인 데이터만 조회 |
| `createCheckout()` | ❌ | 결제 흐름 (user_id 불필요) |
| `getCheckoutStatus()` | ❌ | 결제 흐름 |
| `searchStock()` | ❌ | 종목 검색 (공개 데이터) |

---

## 6. 보안 고려사항

### 6.1 위협 모델

| 위협 | 심각도 | 대응 |
|------|--------|------|
| UUID 스푸핑 | 낮음 | UUID는 추측 불가능, 개인 데이터 가치 낮음 |
| localStorage 접근 | 낮음 | XSS 방지 필요 (Next.js 기본 지원) |
| CORS 우회 | 중간 | 현재 CORS 설정 유지 |

### 6.2 추가 보안 조치 (선택)

```python
# 요청 속도 제한 (선택적)
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/stock")
@limiter.limit("10/minute")  # 분당 10회 제한
async def analyze_stock(...):
    ...
```

---

## 7. 테스트 계획

### 7.1 단위 테스트

```python
# tests/test_user_id.py

def test_get_user_id_valid():
    """유효한 UUID 헤더 테스트"""
    from app.routers.analysis import get_user_id
    user_id = get_user_id("550e8400-e29b-41d4-a716-446655440000")
    assert user_id == "550e8400-e29b-41d4-a716-446655440000"

def test_get_user_id_invalid():
    """잘못된 UUID 형식 테스트"""
    from app.routers.analysis import get_user_id
    with pytest.raises(HTTPException) as exc:
        get_user_id("invalid-uuid")
    assert exc.value.status_code == 400

def test_get_user_id_missing():
    """헤더 누락 테스트"""
    from app.routers.analysis import get_user_id
    with pytest.raises(HTTPException) as exc:
        get_user_id(None)
    assert exc.value.status_code == 400
```

### 7.2 통합 테스트

```bash
# 사용자 A로 분석 생성
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -H "X-User-Id: aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa" \
  -d '{"stock_code": "AAPL", "timeframe": "mid"}'

# 사용자 A 히스토리 (결과 있음)
curl http://localhost:8000/api/analysis/history \
  -H "X-User-Id: aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"

# 사용자 B 히스토리 (빈 결과)
curl http://localhost:8000/api/analysis/history \
  -H "X-User-Id: bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"

# 사용자 B가 사용자 A의 분석 조회 시도 (404)
curl http://localhost:8000/api/analysis/1 \
  -H "X-User-Id: bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"
```

### 7.3 Frontend E2E 테스트

```typescript
// e2e/user-isolation.spec.ts

test('다른 브라우저에서 히스토리 격리', async ({ browser }) => {
  // 브라우저 A에서 분석 생성
  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  await pageA.goto('/');
  // ... 분석 생성 ...

  // 브라우저 B에서 히스토리 확인 (비어있어야 함)
  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  await pageB.goto('/history');
  await expect(pageB.locator('.analysis-item')).toHaveCount(0);
});
```

---

## 8. 구현 체크리스트

### Backend
- [ ] `stock_insight.py`: user_id 컬럼 추가
- [ ] `analysis.py`: get_user_id() 의존성 추가
- [ ] `analysis.py`: POST /stock에 user_id 전달
- [ ] `analysis.py`: GET /history에 user_id 필터 추가
- [ ] `analysis.py`: GET /{id}에 소유권 검증 추가
- [ ] `analysis.py`: GET /latest에 user_id 필터 추가
- [ ] `stock_insight_engine.py`: user_id 파라미터 추가
- [ ] 기존 DB 삭제

### Frontend
- [ ] `userId.ts`: 새 파일 생성
- [ ] `analysis.ts`: getHeaders() 함수 추가
- [ ] `analysis.ts`: analyzeStock() 헤더 추가
- [ ] `analysis.ts`: getAnalysisById() 헤더 추가
- [ ] `analysis.ts`: getAnalysisHistory() 헤더 추가
- [ ] `analysis.ts`: getLatestAnalysis() 헤더 추가

### 검증
- [ ] 새 분석 생성 후 user_id 저장 확인
- [ ] 다른 사용자 히스토리 격리 확인
- [ ] 다른 사용자 분석 접근 시 404 확인

---

## 9. 향후 확장 경로

### OAuth 마이그레이션 (필요시)

```
Phase 1 (현재)          Phase 2 (향후)
─────────────          ──────────────
Browser UUID    ───▶    OAuth Login
localStorage           + UUID 연결

                       users 테이블:
                       - id (OAuth ID)
                       - browser_uuid
                       - email
```

1. `users` 테이블 추가
2. OAuth 로그인 시 localStorage UUID를 계정에 연결
3. 기존 UUID 기반 데이터를 OAuth 계정으로 마이그레이션
4. 여러 기기에서 동일 계정으로 접근 가능

---

**문서 버전:** 1.0
**작성일:** 2025-01-27
**상태:** 승인 대기
