"""
PortOne 결제 API 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime


class PaymentStatus(str, Enum):
    """결제 상태"""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    CANCELLED = "cancelled"


class PreparePaymentRequest(BaseModel):
    """결제 준비 요청"""
    stock_code: str = Field(..., description="분석할 종목코드")
    timeframe: str = Field(..., description="투자 기간")


class PreparePaymentResponse(BaseModel):
    """결제 준비 응답 - 프론트엔드 SDK에 전달할 정보"""
    merchant_uid: str
    amount: int
    product_name: str
    merchant_id: str
    pg_provider: str
    channel_key: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    """결제 검증 요청"""
    imp_uid: str = Field(..., description="PortOne 결제 고유번호")
    merchant_uid: str = Field(..., description="가맹점 주문번호")


class VerifyPaymentResponse(BaseModel):
    """결제 검증 응답"""
    verified: bool
    imp_uid: str
    merchant_uid: str
    amount: int
    status: PaymentStatus
    paid_at: Optional[datetime] = None


class PaymentInfoResponse(BaseModel):
    """결제 정보 조회 응답"""
    imp_uid: str
    merchant_uid: str
    amount: int
    status: PaymentStatus
    pg_provider: str
    pay_method: str
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None


class CancelPaymentRequest(BaseModel):
    """결제 취소 요청"""
    imp_uid: str
    reason: str = "서비스 오류로 인한 환불"
    amount: Optional[int] = None  # None이면 전액 환불


class CancelPaymentResponse(BaseModel):
    """결제 취소 응답"""
    success: bool
    imp_uid: str
    cancelled_amount: int
    message: str
