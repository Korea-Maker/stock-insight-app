# Payment API

Lemon Squeezy 결제 연동 API 엔드포인트 문서입니다.

**Base URL:** `http://localhost:8000/api/payment`

> **Note:** 결제 기능은 선택적입니다. Lemon Squeezy 환경 변수가 설정되지 않으면 분석 API는 무료로 동작합니다.

## 환경 변수 설정

```bash
# backend/.env
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_VARIANT_ID=your_variant_id
```

## 엔드포인트 목록

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/checkout` | 체크아웃 세션 생성 |
| GET | `/checkout/{checkout_id}/status` | 체크아웃 상태 조회 |
| GET | `/checkout/{checkout_id}/verify` | 결제 완료 검증 |

---

## POST /checkout

결제 체크아웃 세션을 생성합니다.

### Request

```json
{
  "stock_code": "AAPL",
  "timeframe": "mid",
  "success_url": "http://localhost:3000/analysis/success",
  "cancel_url": "http://localhost:3000/analysis/cancel"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| stock_code | string | ✅ | 분석할 종목코드 |
| timeframe | string | ✅ | 투자 기간 (short, mid, long) |
| success_url | string | ✅ | 결제 성공 후 리다이렉트 URL |
| cancel_url | string | ❌ | 결제 취소 시 리다이렉트 URL |

### Response (200 OK)

```json
{
  "checkout_id": "chk_1234567890abcdef",
  "checkout_url": "https://yourstorename.lemonsqueezy.com/checkout/...",
  "status": "open"
}
```

### Error Responses

| 상태 코드 | 설명 |
|-----------|------|
| 503 | 결제 서비스가 설정되지 않음 |
| 500 | 체크아웃 세션 생성 실패 |

### 예시

```bash
curl -X POST http://localhost:8000/api/payment/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "stock_code": "AAPL",
    "timeframe": "mid",
    "success_url": "http://localhost:3000/success"
  }'
```

---

## GET /checkout/{checkout_id}/status

체크아웃 세션의 현재 상태를 조회합니다.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| checkout_id | string | 체크아웃 세션 ID |

### Response (200 OK)

```json
{
  "checkout_id": "chk_1234567890abcdef",
  "status": "succeeded",
  "is_completed": true
}
```

### Status 값

| 값 | 설명 |
|----|------|
| `open` | 대기 중 |
| `paid` | 결제 완료 |
| `refunded` | 환불 완료 |
| `expired` | 만료됨 |

### Error Responses

| 상태 코드 | 설명 |
|-----------|------|
| 404 | 체크아웃 세션을 찾을 수 없음 |

### 예시

```bash
curl http://localhost:8000/api/payment/checkout/chk_1234567890abcdef/status
```

---

## GET /checkout/{checkout_id}/verify

결제가 완료되었는지 검증합니다. 분석 실행 전에 호출합니다.

### Path Parameters

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| checkout_id | string | 체크아웃 세션 ID |

### Response (200 OK)

```json
{
  "verified": true,
  "checkout_id": "chk_1234567890abcdef"
}
```

### Error Responses

| 상태 코드 | 설명 |
|-----------|------|
| 402 | 결제가 완료되지 않음 |

### 예시

```bash
curl http://localhost:8000/api/payment/checkout/chk_1234567890abcdef/verify
```

---

## 결제 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│                        결제 플로우                               │
└─────────────────────────────────────────────────────────────────┘

1. 사용자가 분석 요청
   │
   ▼
2. POST /api/payment/checkout
   → checkout_url 반환
   │
   ▼
3. 사용자를 checkout_url로 리다이렉트
   → Lemon Squeezy 결제 페이지에서 결제 진행
   │
   ▼
4. 결제 완료 후 success_url로 리다이렉트
   (URL에 checkout_id 포함)
   │
   ▼
5. GET /api/payment/checkout/{checkout_id}/verify
   → 결제 완료 확인
   │
   ▼
6. POST /api/analysis/stock
   (checkout_id 포함하여 요청)
   │
   ▼
7. 분석 결과 반환
   └─ 실패 시 자동 환불 처리
```

## 자동 환불

분석이 실패하면 자동으로 환불이 처리됩니다:

- 종목을 찾을 수 없는 경우
- AI 분석 중 오류 발생
- 기타 예외 상황

환불 사유:
- `service_disruption`: 서비스 장애로 인한 환불

## 결제 없이 사용

Lemon Squeezy 환경 변수를 설정하지 않으면:

1. `POST /api/payment/checkout` → 503 에러 반환
2. `POST /api/analysis/stock` → checkout_id 없이 바로 분석 실행 가능
