# 테스트 가이드

> **최종 업데이트:** 2025-01-28

Stock Insight App 테스트 전략 및 작성 가이드입니다.

## 테스트 전략

### 테스트 피라미드

```
          ┌───────────┐
          │   E2E     │  ← 적은 수, 핵심 사용자 흐름
          │ Playwright │
          ├───────────┤
          │ 통합 테스트 │  ← API 엔드포인트, DB 연동
          │  pytest   │
          ├───────────┤
          │ 단위 테스트 │  ← 개별 함수, 유틸리티
          │  pytest   │
          └───────────┘
```

### 커버리지 목표

- **전체 커버리지:** 80%+
- **핵심 비즈니스 로직:** 90%+
- **유틸리티 함수:** 80%+

---

## Backend 테스트 (pytest)

### 설정

```bash
cd backend

# 가상환경 활성화
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# 테스트 의존성 설치
pip install pytest pytest-asyncio pytest-cov httpx
```

### pytest.ini

```ini
[pytest]
testpaths = tests
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
python_files = test_*.py
python_classes = Test*
python_functions = test_*
```

### 테스트 실행

```bash
# 전체 테스트 실행
pytest

# 커버리지 리포트
pytest --cov=app --cov-report=html

# 특정 파일 테스트
pytest tests/test_user_isolation.py

# 특정 테스트만 실행
pytest tests/test_user_isolation.py::test_get_user_id_valid

# 상세 출력
pytest -v

# 실패 시 중단
pytest -x
```

### 디렉토리 구조

```
backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py           # 공통 fixture
│   ├── test_user_isolation.py
│   ├── test_stock_data.py
│   └── test_analysis_api.py
```

### conftest.py (공통 Fixture)

```python
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from main import app
from app.core.database import Base, get_db

# 테스트용 인메모리 DB
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def async_client():
    """테스트용 비동기 HTTP 클라이언트"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


@pytest_asyncio.fixture
async def test_db():
    """테스트용 인메모리 데이터베이스"""
    engine = create_async_engine(TEST_DATABASE_URL)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    TestingSessionLocal = sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False
    )

    async with TestingSessionLocal() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
def valid_user_id():
    """유효한 테스트 User ID"""
    return "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa"


@pytest.fixture
def another_user_id():
    """다른 테스트 User ID"""
    return "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb"
```

### 단위 테스트 예제

**tests/test_user_isolation.py:**

```python
import pytest
from fastapi import HTTPException

# 라우터에서 get_user_id 함수 임포트
from app.routers.analysis import get_user_id


def test_get_user_id_valid():
    """유효한 UUID 헤더 테스트"""
    user_id = get_user_id("550e8400-e29b-41d4-a716-446655440000")
    assert user_id == "550e8400-e29b-41d4-a716-446655440000"


def test_get_user_id_invalid():
    """잘못된 UUID 형식 테스트"""
    with pytest.raises(HTTPException) as exc:
        get_user_id("invalid-uuid")
    assert exc.value.status_code == 400
    assert "UUID" in exc.value.detail


def test_get_user_id_missing():
    """헤더 누락 테스트"""
    with pytest.raises(HTTPException) as exc:
        get_user_id(None)
    assert exc.value.status_code == 400
    assert "X-User-Id" in exc.value.detail


def test_get_user_id_empty():
    """빈 문자열 테스트"""
    with pytest.raises(HTTPException) as exc:
        get_user_id("")
    assert exc.value.status_code == 400
```

### 통합 테스트 예제

**tests/test_analysis_api.py:**

```python
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_analyze_stock_without_user_id(async_client: AsyncClient):
    """X-User-Id 없이 분석 요청 시 400 에러"""
    response = await async_client.post(
        "/api/analysis/stock",
        json={"stock_code": "AAPL", "timeframe": "mid"}
    )
    assert response.status_code == 400
    assert "X-User-Id" in response.json()["detail"]


@pytest.mark.asyncio
async def test_analyze_stock_with_valid_user_id(
    async_client: AsyncClient,
    valid_user_id: str
):
    """유효한 User ID로 분석 요청"""
    response = await async_client.post(
        "/api/analysis/stock",
        headers={"X-User-Id": valid_user_id},
        json={"stock_code": "AAPL", "timeframe": "mid"}
    )
    # 실제 API 키가 없으면 다른 에러 코드 반환 가능
    assert response.status_code in [200, 402, 500]


@pytest.mark.asyncio
async def test_history_isolation(
    async_client: AsyncClient,
    valid_user_id: str,
    another_user_id: str
):
    """사용자별 히스토리 격리 테스트"""
    # 사용자 A 히스토리 조회
    response_a = await async_client.get(
        "/api/analysis/history",
        headers={"X-User-Id": valid_user_id}
    )
    assert response_a.status_code == 200

    # 사용자 B 히스토리 조회
    response_b = await async_client.get(
        "/api/analysis/history",
        headers={"X-User-Id": another_user_id}
    )
    assert response_b.status_code == 200

    # 각자의 데이터만 반환되어야 함
    # (테스트 DB가 비어있으므로 둘 다 빈 결과)
    assert response_a.json()["items"] == []
    assert response_b.json()["items"] == []


@pytest.mark.asyncio
async def test_stock_search_no_auth_required(async_client: AsyncClient):
    """종목 검색은 인증 불필요"""
    response = await async_client.get(
        "/api/analysis/search/stock",
        params={"query": "apple"}
    )
    # X-User-Id 없이도 성공해야 함
    assert response.status_code == 200
```

---

## Frontend 테스트

### Playwright E2E 테스트

#### 설치

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

#### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

#### E2E 테스트 예제

**e2e/user-isolation.spec.ts:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('사용자 히스토리 격리', () => {
  test('다른 브라우저 컨텍스트에서 히스토리 격리', async ({ browser }) => {
    // 브라우저 A (새 컨텍스트 = 새 localStorage)
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/history');

    // 브라우저 B (새 컨텍스트)
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/history');

    // 각자 빈 히스토리 (격리 확인)
    await expect(pageA.locator('[data-testid="history-empty"]')).toBeVisible();
    await expect(pageB.locator('[data-testid="history-empty"]')).toBeVisible();

    await contextA.close();
    await contextB.close();
  });

  test('동일 브라우저에서 히스토리 유지', async ({ page }) => {
    // 첫 방문 - UUID 생성
    await page.goto('/');

    // localStorage에 user_id 저장 확인
    const userId = await page.evaluate(() =>
      localStorage.getItem('stock_insight_user_id')
    );
    expect(userId).toBeTruthy();
    expect(userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // 페이지 새로고침 후에도 동일 UUID 유지
    await page.reload();
    const userIdAfterReload = await page.evaluate(() =>
      localStorage.getItem('stock_insight_user_id')
    );
    expect(userIdAfterReload).toBe(userId);
  });
});

test.describe('분석 흐름', () => {
  test('종목 검색 및 분석 요청', async ({ page }) => {
    await page.goto('/');

    // 종목 입력
    const searchInput = page.locator('[data-testid="stock-input"]');
    await searchInput.fill('AAPL');

    // 자동완성 결과 대기
    await expect(
      page.locator('[data-testid="autocomplete-item"]').first()
    ).toBeVisible({ timeout: 5000 });

    // 첫 번째 결과 클릭
    await page.locator('[data-testid="autocomplete-item"]').first().click();

    // 분석 버튼 클릭
    await page.locator('[data-testid="analyze-button"]').click();

    // 로딩 또는 결과 확인
    await expect(
      page.locator('[data-testid="analysis-loading"], [data-testid="analysis-result"]')
    ).toBeVisible({ timeout: 30000 });
  });
});
```

#### 테스트 실행

```bash
# 전체 E2E 테스트
npx playwright test

# UI 모드
npx playwright test --ui

# 특정 테스트 파일
npx playwright test e2e/user-isolation.spec.ts

# 디버그 모드
npx playwright test --debug

# 리포트 보기
npx playwright show-report
```

---

## 모킹 전략

### LLM API 모킹

**tests/mocks/llm_mock.py:**

```python
from unittest.mock import AsyncMock, MagicMock


def create_openai_mock():
    """OpenAI API 모킹"""
    mock = AsyncMock()
    mock.chat.completions.create.return_value = MagicMock(
        choices=[
            MagicMock(
                message=MagicMock(
                    content='{"deep_research": "테스트 분석", "recommendation": "hold"}'
                )
            )
        ]
    )
    return mock


def create_anthropic_mock():
    """Anthropic API 모킹"""
    mock = AsyncMock()
    mock.messages.create.return_value = MagicMock(
        content=[
            MagicMock(
                text='{"deep_research": "테스트 분석", "recommendation": "hold"}'
            )
        ]
    )
    return mock
```

**테스트에서 사용:**

```python
from unittest.mock import patch
from tests.mocks.llm_mock import create_openai_mock


@pytest.mark.asyncio
async def test_generate_insight_with_mock():
    """LLM API 모킹하여 분석 엔진 테스트"""
    mock_client = create_openai_mock()

    with patch.object(
        stock_insight_engine,
        'openai_client',
        mock_client
    ):
        result = await stock_insight_engine.generate_insight(
            stock_code="AAPL",
            timeframe="mid",
            user_id="test-user-id"
        )

    assert result is not None
    mock_client.chat.completions.create.assert_called_once()
```

### 외부 API 모킹 (Finnhub)

```python
from unittest.mock import patch, MagicMock


@pytest.fixture
def mock_finnhub_response():
    """Finnhub API 응답 모킹"""
    return {
        "c": 185.92,  # current price
        "d": 2.34,    # change
        "dp": 1.27,   # percent change
        "h": 186.50,  # high
        "l": 183.20,  # low
        "o": 184.00,  # open
        "pc": 183.58, # previous close
    }


@pytest.mark.asyncio
async def test_get_stock_data_mocked(mock_finnhub_response):
    """Finnhub API 모킹하여 주식 데이터 조회 테스트"""
    with patch('httpx.AsyncClient.get') as mock_get:
        mock_get.return_value = MagicMock(
            status_code=200,
            json=lambda: mock_finnhub_response
        )

        result = await stock_data_service.get_stock_data("AAPL")

    assert result is not None
    assert result.current_price == 185.92
```

---

## CI/CD 통합

### GitHub Actions 예제

**.github/workflows/test.yml:**

```yaml
name: Tests

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        working-directory: ./backend
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov httpx

      - name: Run tests
        working-directory: ./backend
        run: pytest --cov=app --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Install Playwright browsers
        working-directory: ./frontend
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        working-directory: ./frontend
        run: npx playwright test
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8000

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/
```

---

## 테스트 베스트 프랙티스

### 명명 규칙

```python
# 좋은 예: 명확한 테스트 의도
def test_get_user_id_returns_400_when_header_missing():
    ...

def test_history_isolation_between_different_users():
    ...

# 나쁜 예: 모호한 이름
def test_user_id():
    ...

def test_history():
    ...
```

### AAA 패턴 (Arrange-Act-Assert)

```python
def test_valid_uuid_parsing():
    # Arrange (준비)
    valid_uuid = "550e8400-e29b-41d4-a716-446655440000"

    # Act (실행)
    result = get_user_id(valid_uuid)

    # Assert (검증)
    assert result == valid_uuid
```

### 테스트 격리

```python
@pytest.fixture(autouse=True)
async def reset_database(test_db):
    """각 테스트 전후 DB 초기화"""
    yield
    # 테스트 후 정리
    await test_db.execute("DELETE FROM stock_insights")
    await test_db.commit()
```

---

## 관련 문서

- [개발 가이드](./DEVELOPMENT.md) - 로컬 환경 설정
- [트러블슈팅](./TROUBLESHOOTING.md) - 에러 해결
- [API 인증](../api/AUTHENTICATION.md) - 인증 방식
