# 배포 가이드

> **최종 업데이트:** 2025-01-28

Stock Insight App 배포 가이드입니다.

## 배포 환경

| 환경 | 설명 | URL 예시 |
|------|------|----------|
| Development | 로컬 개발 | localhost:3000/8000 |
| Staging | 테스트/QA | staging.stockinsight.app |
| Production | 프로덕션 | stockinsight.app |

---

## Docker 배포

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - FINNHUB_API=${FINNHUB_API}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LEMONSQUEEZY_API_KEY=${LEMONSQUEEZY_API_KEY}
      - LEMONSQUEEZY_STORE_ID=${LEMONSQUEEZY_STORE_ID}
      - LEMONSQUEEZY_VARIANT_ID=${LEMONSQUEEZY_VARIANT_ID}
      - LLM_PRIMARY_PROVIDER=openai
      - DATABASE_URL=sqlite:///./data/stock_insights.db
    volumes:
      - backend-data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:8000}
    ports:
      - "3000:3000"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  backend-data:
```

### Backend Dockerfile

**backend/Dockerfile:**

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드
COPY . .

# 데이터 디렉토리
RUN mkdir -p /app/data

# 비루트 사용자
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

CMD ["python", "main.py"]
```

### Frontend Dockerfile

**frontend/Dockerfile:**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 빌드 인자
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 빌드
COPY . .
RUN npm run build

# 프로덕션 이미지
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# 비루트 사용자
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Docker 실행

```bash
# 환경 변수 파일 준비
cp .env.example .env
# .env 파일 편집

# 빌드 및 실행
docker-compose up -d --build

# 로그 확인
docker-compose logs -f

# 중지
docker-compose down
```

---

## Vercel 배포 (Frontend)

### 1. Vercel 프로젝트 설정

```bash
cd frontend
npx vercel
```

### 2. 환경 변수

Vercel Dashboard > Project Settings > Environment Variables:

| 변수 | 값 |
|------|-----|
| `NEXT_PUBLIC_API_URL` | `https://api.stockinsight.app` |

### 3. vercel.json

**frontend/vercel.json:**

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["icn1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 4. 배포

```bash
# 프로덕션 배포
npx vercel --prod
```

---

## Railway 배포 (Backend)

### 1. Railway 프로젝트 생성

```bash
# Railway CLI 설치
npm install -g @railway/cli

# 로그인
railway login

# 프로젝트 초기화
cd backend
railway init
```

### 2. 환경 변수

Railway Dashboard > Variables:

| 변수 | 설명 |
|------|------|
| `OPENAI_API_KEY` | OpenAI API 키 |
| `FINNHUB_API` | Finnhub API 키 |
| `ANTHROPIC_API_KEY` | Anthropic API 키 (선택) |
| `LEMONSQUEEZY_API_KEY` | Lemon Squeezy API 키 |
| `LEMONSQUEEZY_STORE_ID` | Lemon Squeezy Store ID |
| `LEMONSQUEEZY_VARIANT_ID` | Lemon Squeezy Variant ID |
| `LLM_PRIMARY_PROVIDER` | `openai` |
| `CORS_ORIGINS` | `https://stockinsight.app` |

### 3. railway.json

**backend/railway.json:**

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 10
  }
}
```

### 4. 배포

```bash
railway up
```

---

## PostgreSQL 마이그레이션

프로덕션 환경에서는 SQLite 대신 PostgreSQL 사용을 권장합니다.

### 1. 환경 변수 변경

```bash
# .env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/stockinsight
```

### 2. 의존성 추가

**backend/requirements.txt:**

```
asyncpg==0.29.0
psycopg2-binary==2.9.9
```

### 3. database.py 수정

**backend/app/core/database.py:**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# PostgreSQL 연결 (프로덕션)
# SQLite 연결 (개발)
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    # PostgreSQL 전용 옵션
    pool_size=5 if "postgresql" in settings.database_url else 1,
    max_overflow=10 if "postgresql" in settings.database_url else 0,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 4. Alembic 마이그레이션 (선택)

```bash
# Alembic 설치
pip install alembic

# 초기화
cd backend
alembic init alembic

# 마이그레이션 생성
alembic revision --autogenerate -m "Initial migration"

# 마이그레이션 실행
alembic upgrade head
```

---

## 프로덕션 체크리스트

### 보안

- [ ] API 키가 환경 변수로 관리됨
- [ ] CORS 설정이 허용된 도메인만 포함
- [ ] HTTPS 활성화
- [ ] 민감한 데이터 로깅 비활성화
- [ ] Rate limiting 설정

### 성능

- [ ] 캐싱 전략 설정 (Redis 등)
- [ ] 데이터베이스 인덱스 최적화
- [ ] CDN 설정 (정적 자산)
- [ ] 이미지 최적화

### 모니터링

- [ ] 에러 추적 (Sentry 등)
- [ ] 로그 수집 (CloudWatch, Datadog 등)
- [ ] 업타임 모니터링
- [ ] APM 설정

### 백업

- [ ] 데이터베이스 자동 백업
- [ ] 환경 변수 백업
- [ ] 롤백 전략

---

## 환경별 설정

### development

```bash
# backend/.env.development
DEBUG=true
DATABASE_URL=sqlite+aiosqlite:///./stock_insights.db
CORS_ORIGINS=http://localhost:3000
```

### staging

```bash
# backend/.env.staging
DEBUG=false
DATABASE_URL=postgresql+asyncpg://...
CORS_ORIGINS=https://staging.stockinsight.app
```

### production

```bash
# backend/.env.production
DEBUG=false
DATABASE_URL=postgresql+asyncpg://...
CORS_ORIGINS=https://stockinsight.app,https://www.stockinsight.app
```

---

## 롤백 절차

### Docker

```bash
# 이전 이미지로 롤백
docker-compose down
docker-compose up -d --no-build
```

### Vercel

```bash
# 이전 배포로 롤백
vercel rollback
```

### Railway

```bash
# 이전 배포로 롤백
railway rollback
```

---

## 트러블슈팅

### Docker 빌드 실패

```bash
# 캐시 무시하고 재빌드
docker-compose build --no-cache

# 볼륨 정리
docker volume prune
```

### 환경 변수 누락

```bash
# 환경 변수 확인
docker-compose exec backend env | grep OPENAI
```

### 데이터베이스 연결 실패

```bash
# 컨테이너 내부에서 연결 테스트
docker-compose exec backend python -c "
from app.core.database import engine
import asyncio
asyncio.run(engine.connect())
print('Connection successful')
"
```

---

## 관련 문서

- [개발 가이드](./DEVELOPMENT.md) - 로컬 환경 설정
- [테스트 가이드](./TESTING.md) - 테스트 전략
- [트러블슈팅](./TROUBLESHOOTING.md) - 에러 해결
