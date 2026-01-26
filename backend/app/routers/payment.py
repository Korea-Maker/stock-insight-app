"""
결제 API 라우터
Polar를 통한 결제 체크아웃 세션 관리
"""
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.services.payment_service import payment_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/payment", tags=["Payment"])


class CheckoutRequest(BaseModel):
    """체크아웃 요청"""
    stock_code: str
    timeframe: str
    success_url: str
    cancel_url: Optional[str] = None


class CheckoutResponse(BaseModel):
    """체크아웃 응답"""
    checkout_id: str
    checkout_url: str
    status: str


class CheckoutStatusResponse(BaseModel):
    """체크아웃 상태 응답"""
    checkout_id: str
    status: str
    is_completed: bool


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(request: CheckoutRequest):
    """
    결제 체크아웃 세션 생성

    분석 요청 전에 결제 세션을 생성합니다.
    - **stock_code**: 분석할 종목코드
    - **timeframe**: 투자 기간 (short, mid, long)
    - **success_url**: 결제 성공 후 리다이렉트 URL
    - **cancel_url**: 결제 취소 시 리다이렉트 URL (선택)
    """
    if not payment_service.is_configured():
        raise HTTPException(
            status_code=503,
            detail="결제 서비스가 설정되지 않았습니다."
        )

    # 메타데이터에 분석 정보 포함
    metadata = {
        "stock_code": request.stock_code,
        "timeframe": request.timeframe,
    }

    checkout = await payment_service.create_checkout_session(
        success_url=request.success_url,
        cancel_url=request.cancel_url,
        metadata=metadata,
    )

    if not checkout:
        raise HTTPException(
            status_code=500,
            detail="결제 세션 생성에 실패했습니다."
        )

    logger.info(f"체크아웃 생성: {checkout.id} for {request.stock_code}")

    return CheckoutResponse(
        checkout_id=checkout.id,
        checkout_url=checkout.url,
        status=checkout.status,
    )


@router.get("/checkout/{checkout_id}/status", response_model=CheckoutStatusResponse)
async def get_checkout_status(checkout_id: str):
    """
    체크아웃 상태 조회

    결제 완료 여부를 확인합니다.
    - **checkout_id**: 체크아웃 세션 ID
    """
    session = await payment_service.get_checkout_session(checkout_id)

    if not session:
        raise HTTPException(
            status_code=404,
            detail="체크아웃 세션을 찾을 수 없습니다."
        )

    status = session.get("status", "unknown")
    is_completed = status in ("succeeded", "confirmed", "completed")

    return CheckoutStatusResponse(
        checkout_id=checkout_id,
        status=status,
        is_completed=is_completed,
    )


@router.get("/checkout/{checkout_id}/verify")
async def verify_payment(checkout_id: str):
    """
    결제 완료 검증

    분석 실행 전 결제 완료를 검증합니다.
    - **checkout_id**: 체크아웃 세션 ID
    """
    is_completed = await payment_service.verify_checkout_completed(checkout_id)

    if not is_completed:
        raise HTTPException(
            status_code=402,
            detail="결제가 완료되지 않았습니다."
        )

    return {"verified": True, "checkout_id": checkout_id}
