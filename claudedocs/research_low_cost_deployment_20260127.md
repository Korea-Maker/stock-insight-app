# Stock Insight App 저비용 배포 리서치 보고서

**작성일**: 2026-01-27
**목적**: Next.js 15 + FastAPI + SQLite 아키텍처의 최소 비용 배포 전략

---

## 1. 현재 아키텍처 분석

| 구성요소 | 기술 스택 | 배포 요구사항 |
|----------|-----------|---------------|
| **Frontend** | Next.js 15, React 19, TypeScript | Node.js 런타임, SSR 지원 |
| **Backend** | Python FastAPI, SQLAlchemy | Python 3.11+, ASGI 서버 |
| **Database** | SQLite | 파일 기반, 영구 스토리지 필요 |
| **외부 API** | OpenAI, Finnhub | API 키 환경변수 |

### 핵심 고려사항
- SQLite는 서버리스 환경에서 제한적 (파일 시스템 영속성 필요)
- FastAPI는 ASGI 서버(Uvicorn) 필요
- AI API 호출로 인한 긴 응답 시간 (60초+ 가능)

---

## 2. 배포 옵션 비교

### 2.1 Frontend (Next.js 15)

| 플랫폼 | 무료 티어 | 제한사항 | 추천도 |
|--------|-----------|----------|--------|
| **Vercel** | O | 100GB 대역폭, 60초 함수 타임아웃, 상업적 사용 불가 | ⭐⭐⭐⭐⭐ |
| **Netlify** | O | 100GB 대역폭, 10초 함수 타임아웃 | ⭐⭐⭐ |
| **Cloudflare Pages** | O | 무제한 대역폭, Workers 제한 | ⭐⭐⭐⭐ |

**추천: Vercel (Hobby Plan)**
- Next.js 제작사로 최적화된 배포 경험
- 무료 SSL, CDN, 자동 배포
- 100GB/월 대역폭 (개인 프로젝트 충분)

### 2.2 Backend (FastAPI)

| 플랫폼 | 무료 티어 | 제한사항 | SQLite 지원 | 추천도 |
|--------|-----------|----------|-------------|--------|
| **Render** | O | 15분 비활성 시 슬립, 750시간/월 | O (디스크) | ⭐⭐⭐⭐ |
| **Koyeb** | O | 512MB RAM, 0.1 vCPU, 2GB SSD | O | ⭐⭐⭐⭐ |
| **Railway** | X | $5 크레딧 소진 시 중단 | O | ⭐⭐ |
| **Fly.io** | 부분 | 3개 VM 무료, 복잡한 설정 | O (볼륨) | ⭐⭐⭐ |

**추천: Render 또는 Koyeb**

#### Render 장점
- SQLite 파일 영속성 지원 (디스크 마운트)
- 간단한 Git 기반 배포
- 무료 PostgreSQL 90일 제공 (업그레이드 시)

#### Render 단점
- 15분 비활성 시 슬립 → 첫 요청 2-3분 지연
- 슬립 방지를 위해 UptimeRobot 등 외부 모니터링 필요

#### Koyeb 장점
- 24/7 운영 (슬립 없음)
- 2GB SSD로 SQLite 충분
- 신용카드 필요하지만 요금 발생 없음

### 2.3 Database 옵션 (SQLite 대체 시)

현재 SQLite를 사용 중이나, 서버리스 환경에서는 관리형 PostgreSQL이 더 적합할 수 있습니다.

| 플랫폼 | 무료 티어 | 스토리지 | Scale-to-Zero | 추천도 |
|--------|-----------|----------|---------------|--------|
| **Neon** | O | 512MB | O | ⭐⭐⭐⭐⭐ |
| **Supabase** | O | 500MB | X | ⭐⭐⭐⭐ |
| **PlanetScale** | 종료됨 | - | - | - |

**SQLite 유지 시**: Render/Koyeb의 영구 디스크 사용
**PostgreSQL 전환 시**: Neon 추천 (scale-to-zero로 비용 최소화)

---

## 3. 추천 배포 조합

### 옵션 A: 완전 무료 (슬립 허용)

```
Frontend: Vercel (Hobby)     → $0/월
Backend:  Render (Free)      → $0/월
Database: SQLite (Render 디스크) → $0/월
───────────────────────────────────
총 비용: $0/월
```

**장점**: 완전 무료
**단점**: 15분 비활성 시 백엔드 슬립, 첫 요청 2-3분 지연

### 옵션 B: 완전 무료 (슬립 없음)

```
Frontend: Vercel (Hobby)     → $0/월
Backend:  Koyeb (Starter)    → $0/월
Database: SQLite (Koyeb SSD) → $0/월
───────────────────────────────────
총 비용: $0/월
```

**장점**: 24/7 운영, 슬립 없음
**단점**: 512MB RAM 제한, 신용카드 등록 필요

### 옵션 C: 최소 비용 (안정적 운영)

```
Frontend: Vercel (Hobby)     → $0/월
Backend:  Render (Starter)   → $7/월
Database: Neon (Free)        → $0/월
───────────────────────────────────
총 비용: $7/월
```

**장점**: 슬립 없음, PostgreSQL로 확장성 확보
**단점**: 월 $7 비용 발생

---

## 4. 권장 배포 전략

### Phase 1: 프로토타입/테스트 (옵션 B 추천)

```
Vercel + Koyeb + SQLite
```

1. **Frontend → Vercel**
   - GitHub 연동으로 자동 배포
   - 환경변수에 백엔드 URL 설정

2. **Backend → Koyeb**
   - Dockerfile 작성 필요
   - SQLite 파일은 /app/data에 마운트
   - 24/7 운영으로 사용자 경험 개선

### Phase 2: 프로덕션 전환 시

```
Vercel + Render ($7) + Neon (PostgreSQL)
```

- SQLite → PostgreSQL 마이그레이션
- 동시 접속 처리 능력 향상
- 데이터 백업/복구 용이

---

## 5. 배포 준비 체크리스트

### Backend (Koyeb/Render)

- [ ] `Dockerfile` 작성
- [ ] `requirements.txt` 최신화
- [ ] 환경변수 설정 (OPENAI_API_KEY, FINNHUB_API 등)
- [ ] CORS 설정 (Vercel 도메인 허용)
- [ ] 헬스체크 엔드포인트 확인 (`/health`)

### Frontend (Vercel)

- [ ] `next.config.js`에서 API URL 환경변수화
- [ ] `.env.local` → Vercel 환경변수로 이전
- [ ] 빌드 테스트 (`npm run build`)

### 공통

- [ ] HTTPS 강제 적용
- [ ] 에러 로깅 설정
- [ ] API 키 보안 확인 (클라이언트 노출 금지)

---

## 6. 추가 비용 최적화 팁

1. **UptimeRobot (무료)**: Render 무료 티어 사용 시 슬립 방지
2. **Cloudflare (무료)**: 추가 CDN 및 DDoS 보호
3. **GitHub Actions**: CI/CD 자동화 (무료 2,000분/월)

---

## Sources

### Backend Hosting
- [Python Hosting Options Comparison](https://www.nandann.com/blog/python-hosting-options-comparison)
- [FastAPI Deployment Options | Render](https://render.com/articles/fastapi-deployment-options)
- [Railway vs Fly.io vs Render Comparison](https://medium.com/ai-disruption/railway-vs-fly-io-vs-render-which-cloud-gives-you-the-best-roi-2e3305399e5b)
- [Render Alternatives 2026](https://northflank.com/blog/render-alternatives)
- [How to Keep FastAPI Active on Render Free Tier](https://medium.com/@saveriomazza/how-to-keep-your-fastapi-server-active-on-renders-free-tier-93767b70365c)
- [Koyeb Pricing](https://www.koyeb.com/pricing)
- [Koyeb Free Tier Infographic](https://www.freetiers.com/directory/koyeb)

### Frontend Hosting
- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Limits Documentation](https://vercel.com/docs/limits)
- [Vercel App Guide 2026](https://kuberns.com/blogs/post/vercel-app-guide/)

### Database
- [Neon vs Supabase Comparison](https://www.bytebase.com/blog/neon-vs-supabase/)
- [Best PostgreSQL Hosting Providers 2026](https://northflank.com/blog/best-postgresql-hosting-providers)
- [Top PostgreSQL Free Tiers 2026 | Koyeb](https://www.koyeb.com/blog/top-postgresql-database-free-tiers-in-2026)

---

**결론**: 개인 프로젝트/테스트 목적이라면 **Vercel + Koyeb + SQLite** 조합으로 완전 무료 24/7 운영이 가능합니다. 프로덕션 레벨에서는 **Vercel + Render ($7) + Neon** 조합을 권장합니다.
