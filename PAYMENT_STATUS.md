# 결제 시스템 현황 및 TODO

> 최종 업데이트: 2026-01-31

---

## 현재 상황 요약

### 문제점

1. **Polar.sh** - ❌ 거절됨
   - 사유: 주식 관련 데이터 판매 정책 위반
   - 상태: 사용 불가

2. **PortOne (아임포트)** - ⚠️ 구현 완료, 사용 불가
   - 코드: 마이그레이션 완료 (이 세션에서 작업)
   - 문제: **사업자등록증 필수**
   - 상태: 사업자 없이는 사용 불가

3. **Lemon Squeezy** - ✅ 기존 코드 존재, 확인 필요
   - 코드: Git 히스토리에 존재 (PortOne 마이그레이션 전)
   - 정책: 주식 분석 도구 **명시적 금지 아님**
   - 상태: **지원팀 문의 필요**

---

## 결제 서비스 비교

| 서비스 | 사업자 필요 | 주식 분석 허용 | 한국 결제 | 수수료 | 상태 |
|--------|------------|---------------|----------|--------|------|
| Polar.sh | X | ❌ 거절됨 | X | 5% | 불가 |
| PortOne | **O 필수** | ✅ | ✅ 최고 | ~3% | 사업자 필요 |
| Lemon Squeezy | X | ⚠️ 확인필요 | ⚠️ 제한적 | 5% | **문의 중** |
| Paddle | X | ⚠️ 확인필요 | ✅ | 5% | 백업 옵션 |
| PayPal | X | ✅ | ⚠️ 불편 | 2.9% | 최후 수단 |

---

## TODO 리스트

### 즉시 해야 할 일 (이번 주)

- [ ] **Lemon Squeezy 지원팀 문의**
  - 이메일: help@lemonsqueezy.com
  - 문의 내용:
    ```
    Subject: Policy question - AI stock analysis tool

    Hi,

    I'm building an AI-powered stock analysis tool that provides
    data analytics and research reports (NOT investment advice
    or trading).

    Is this type of product allowed on Lemon Squeezy?

    The tool:
    - Analyzes publicly available stock data
    - Generates research reports using AI
    - Does NOT provide investment recommendations
    - Does NOT handle any financial transactions

    Thank you.
    ```

- [ ] **Paddle 지원팀에도 동시 문의** (백업)
  - 동일한 내용으로 문의
  - URL: https://www.paddle.com/contact

### Lemon Squeezy 허용 시

- [ ] PortOne 코드를 별도 브랜치로 보관
  ```bash
  git checkout -b feature/portone-payment
  git add .
  git commit -m "feat: PortOne payment integration (for future use)"
  git checkout master
  ```

- [ ] Lemon Squeezy 코드 복원
  ```bash
  git revert <portone-migration-commit>
  # 또는 특정 파일만 복원
  git checkout <lemon-squeezy-commit> -- backend/app/services/payment_service.py
  git checkout <lemon-squeezy-commit> -- backend/app/routers/payment.py
  # ... 등
  ```

- [ ] 환경변수 재설정 (.env)
  ```
  LEMONSQUEEZY_API_KEY=
  LEMONSQUEEZY_STORE_ID=
  LEMONSQUEEZY_VARIANT_ID=
  ```

### Lemon Squeezy 거절 시

- [ ] Paddle로 재시도
- [ ] 거절 시: PayPal로 MVP 런칭 (한국 사용자 불편하지만 검증용)
- [ ] 매출 발생 후: 일반과세자 사업자등록 → PortOne 활성화

### 장기 계획 (매출 발생 후)

- [ ] 사업자등록 검토 (일반과세자)
  - 소프트웨어/SaaS는 간이과세 불가
  - 창업 중소기업 감면 혜택 확인 (5년간 50~100% 소득세 감면)

- [ ] PortOne 재활성화
  - 이미 구현된 코드 사용
  - 한국 결제 최적화 (카카오페이, 네이버페이 등)

---

## 코드 현황

### 현재 브랜치: master

**PortOne 구현 완료된 파일:**
```
backend/
├── app/core/config.py          # PORTONE_* 환경변수
├── app/schemas/payment.py      # 결제 스키마 (NEW)
├── app/services/payment_store.py   # 금액 검증 저장소 (NEW)
├── app/services/payment_service.py # PortOnePaymentService
├── app/routers/payment.py      # /prepare, /verify, /cancel
└── app/routers/analysis.py     # merchant_uid 연동

frontend/
├── types/payment.ts            # TypeScript 타입 (NEW)
├── lib/api/payment.ts          # 결제 API 클라이언트 (NEW)
├── lib/portone/sdk.ts          # SDK 래퍼 (NEW)
├── store/useAnalysisStore.ts   # merchantUid, impUid 상태
├── components/Analysis/AnalysisForm.tsx  # 인라인 결제 모달
└── app/payment/complete/page.tsx  # 모바일 리다이렉트 (NEW)
```

### Git 커밋 히스토리 (참고)
```
3ced8df feat: Polar.sh에서 Lemon Squeezy로 결제 시스템 마이그레이션
9c772da revert: Polar.sh 결제 시스템 재활성화
3b6e7b1 fix: 백엔드 결제 검증 로직 비활성화
```

---

## 연락처 & 참고 링크

- **Lemon Squeezy 정책**: https://docs.lemonsqueezy.com/help/getting-started/prohibited-products
- **Paddle 정책**: https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle
- **PortOne 가입**: https://admin.portone.io
- **사업자등록 안내**: https://www.nts.go.kr

---

## 의사결정 플로우차트

```
Lemon Squeezy 문의
        │
        ▼
    허용됨? ──Yes──▶ Lemon Squeezy로 롤백 ──▶ 런칭!
        │
       No
        │
        ▼
  Paddle 문의
        │
        ▼
    허용됨? ──Yes──▶ Paddle로 구현 ──▶ 런칭!
        │
       No
        │
        ▼
  PayPal로 MVP 런칭 (검증용)
        │
        ▼
  매출 발생 시 사업자등록
        │
        ▼
  PortOne 활성화 (한국 최적화)
```

---

*이 문서는 결제 시스템 결정 전까지 참고용으로 유지*
