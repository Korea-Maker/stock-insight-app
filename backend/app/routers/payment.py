"""
결제 API 라우터
PortOne 결제 연동
"""
import logging
from fastapi import APIRouter, HTTPException, Header
from typing import Annotated

from app.services.payment_service import payment_service
from app.schemas.payment import (
    PreparePaymentRequest,
    PreparePaymentResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
    PaymentInfoResponse,
    CancelPaymentRequest,
    CancelPaymentResponse,
    PaymentStatus,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["Payment"])


def get_user_id(
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None
) -> str:
    """X-User-Id 헤더에서 사용자 ID 추출"""
    return x_user_id or "anonymous"


@router.post("/prepare", response_model=PreparePaymentResponse)
async def prepare_payment(
    request: PreparePaymentRequest,
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
):
    """
    결제 준비

    프론트엔드 SDK에서 결제창을 띄우기 전에 호출합니다.
    서버에서 예상 금액을 저장하고, SDK 초기화에 필요한 정보를 반환합니다.
    """
    if not payment_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="결제 서비스가 설정되지 않았습니다"
        )

    try:
        user_id = x_user_id or "anonymous"
        result = payment_service.prepare_payment(
            stock_code=request.stock_code,
            timeframe=request.timeframe,
            user_id=user_id,
        )

        logger.info(f"결제 준비: merchant_uid={result['merchant_uid']}, stock={request.stock_code}")

        return PreparePaymentResponse(
            merchant_uid=result["merchant_uid"],
            amount=result["amount"],
            product_name=result["product_name"],
            merchant_id=result["merchant_id"],
            pg_provider=result["pg_provider"],
            channel_key=result.get("channel_key"),
        )

    except Exception as e:
        logger.error(f"결제 준비 실패: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="결제 준비 중 오류가 발생했습니다")


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(request: VerifyPaymentRequest):
    """
    결제 검증

    프론트엔드 SDK 콜백 후 호출합니다.
    PortOne API로 실제 결제 정보를 조회하여 금액을 검증합니다.
    """
    if not payment_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="결제 서비스가 설정되지 않았습니다"
        )

    success, payment, error = await payment_service.verify_payment(
        imp_uid=request.imp_uid,
        merchant_uid=request.merchant_uid,
    )

    if not success:
        raise HTTPException(status_code=402, detail=error or "결제 검증 실패")

    return VerifyPaymentResponse(
        verified=True,
        imp_uid=payment.imp_uid,
        merchant_uid=payment.merchant_uid,
        amount=payment.amount,
        status=PaymentStatus.PAID,
        paid_at=payment.paid_at,
    )


@router.get("/{imp_uid}", response_model=PaymentInfoResponse)
async def get_payment_info(imp_uid: str):
    """결제 정보 조회"""
    if not payment_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="결제 서비스가 설정되지 않았습니다"
        )

    payment = await payment_service.get_payment_info(imp_uid)

    if not payment:
        raise HTTPException(status_code=404, detail="결제 정보를 찾을 수 없습니다")

    # Map status string to enum
    status_map = {
        "paid": PaymentStatus.PAID,
        "ready": PaymentStatus.PENDING,
        "failed": PaymentStatus.FAILED,
        "cancelled": PaymentStatus.CANCELLED,
    }

    return PaymentInfoResponse(
        imp_uid=payment.imp_uid,
        merchant_uid=payment.merchant_uid,
        amount=payment.amount,
        status=status_map.get(payment.status, PaymentStatus.PENDING),
        pg_provider=payment.pg_provider,
        pay_method=payment.pay_method,
        paid_at=payment.paid_at,
        cancelled_at=payment.cancelled_at,
    )


@router.post("/cancel", response_model=CancelPaymentResponse)
async def cancel_payment(request: CancelPaymentRequest):
    """결제 취소 (환불)"""
    if not payment_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="결제 서비스가 설정되지 않았습니다"
        )

    success, cancelled_amount, error = await payment_service.cancel_payment(
        imp_uid=request.imp_uid,
        reason=request.reason,
        amount=request.amount,
    )

    if not success:
        raise HTTPException(status_code=400, detail=error or "결제 취소 실패")

    return CancelPaymentResponse(
        success=True,
        imp_uid=request.imp_uid,
        cancelled_amount=cancelled_amount or 0,
        message="환불이 완료되었습니다",
    )
