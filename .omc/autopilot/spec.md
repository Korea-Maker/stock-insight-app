# PortOne Payment Migration Specification

## Project Overview

Migrate payment system from Lemon Squeezy to PortOne (I'mport) for Korean stock analysis SaaS.

## Requirements Summary

### Functional Requirements
1. Pay-per-analysis payment model (3,900 KRW per analysis)
2. Korean card payments + Kakao Pay support
3. Inline SDK modal (not redirect)
4. Server-side payment verification (amount tampering prevention)
5. Auto-refund on analysis failure

### Non-Functional Requirements
1. 95%+ payment success rate
2. < 60 seconds from checkout to analysis start
3. Mobile browser support (iOS Safari, Android Chrome)
4. Korean language error messages

## Architecture

### Flow Diagram
```
User submits form
    ↓
POST /api/payment/prepare (save expected amount)
    ↓
Frontend loads PortOne SDK modal
    ↓
User completes payment in modal
    ↓
SDK callback with imp_uid
    ↓
POST /api/payment/verify (compare amounts)
    ↓
POST /api/analysis/stock (run AI analysis)
```

### Key Differences from Lemon Squeezy

| Aspect | Lemon Squeezy | PortOne |
|--------|---------------|---------|
| Checkout UI | External redirect | Inline SDK modal |
| API Auth | Bearer token | API Key/Secret → Access token |
| Payment ID | checkout_id | imp_uid + merchant_uid |
| Verification | GET orders by checkout | GET payments by imp_uid |

## File Changes

### Backend (Python FastAPI)

| File | Action | Purpose |
|------|--------|---------|
| `app/core/config.py` | MODIFY | Add PORTONE_* env vars, remove LEMONSQUEEZY_* |
| `app/schemas/payment.py` | NEW | Pydantic models for payment API |
| `app/services/payment_store.py` | NEW | In-memory expected amount store |
| `app/services/payment_service.py` | REPLACE | PortOnePaymentService class |
| `app/routers/payment.py` | MODIFY | New endpoints: prepare, verify, cancel |
| `app/routers/analysis.py` | MODIFY | Use merchant_uid instead of checkout_id |
| `app/schemas/analysis.py` | MODIFY | Add merchant_uid field |

### Frontend (Next.js 15)

| File | Action | Purpose |
|------|--------|---------|
| `types/payment.ts` | NEW | TypeScript interfaces |
| `lib/api/payment.ts` | NEW | Payment API client |
| `lib/portone/sdk.ts` | NEW | PortOne SDK wrapper |
| `store/useAnalysisStore.ts` | MODIFY | merchantUid, impUid, isPaying states |
| `components/Analysis/AnalysisForm.tsx` | MODIFY | Inline modal flow |
| `app/payment/complete/page.tsx` | NEW | Mobile redirect handler |
| `lib/api/analysis.ts` | MODIFY | Pass merchant_uid to analyzeStock |

## Environment Variables

### Backend (.env)
```bash
# Remove
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_VARIANT_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=

# Add
PORTONE_API_KEY=
PORTONE_API_SECRET=
PORTONE_MERCHANT_ID=imp_XXXXXXXX
PORTONE_PG_PROVIDER=tosspayments
PORTONE_CHANNEL_KEY=
ANALYSIS_PRICE_KRW=3900
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/payment/prepare` | POST | Create merchant_uid, store expected amount |
| `/api/payment/verify` | POST | Verify payment with PortOne API |
| `/api/payment/{imp_uid}` | GET | Get payment info |
| `/api/payment/cancel` | POST | Refund payment |

## Implementation Order

1. Backend config (PORTONE_* env vars)
2. Backend schemas (payment.py)
3. Backend payment store
4. Backend payment service
5. Backend payment router
6. Backend analysis router update
7. Frontend types
8. Frontend payment API client
9. Frontend SDK wrapper
10. Frontend store update
11. Frontend AnalysisForm update
12. Frontend mobile redirect page
13. Testing

## Security Requirements

1. NEVER trust frontend-provided payment amounts
2. Always verify with PortOne API server-side
3. Compare expected vs actual amounts
4. Auto-cancel on amount mismatch
5. Store expected amounts server-side before payment

## Decisions Made

- PG Provider: Toss Payments (modern, good docs)
- UI Pattern: Inline SDK modal (better UX)
- Payment Methods: Korean cards + Kakao Pay
- Price: 3,900 KRW per analysis
- Store: In-memory (Redis for production later)
