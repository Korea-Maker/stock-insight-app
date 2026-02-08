"""
PortOne 결제 서비스
한국 결제 PG 연동을 위한 PortOne REST API 클라이언트
"""
import logging
import uuid
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from datetime import datetime

import httpx

from app.core.config import settings
from app.services.payment_store import payment_expectation_store, PaymentExpectation

logger = logging.getLogger(__name__)


@dataclass
class PortOnePayment:
    """PortOne 결제 정보"""
    imp_uid: str
    merchant_uid: str
    amount: int
    status: str  # paid, ready, failed, cancelled
    pg_provider: str
    pay_method: str
    paid_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    cancel_amount: int = 0


class PortOnePaymentService:
    """PortOne 결제 서비스"""

    def __init__(self):
        self.api_key = settings.PORTONE_API_KEY
        self.api_secret = settings.PORTONE_API_SECRET
        self.merchant_id = settings.PORTONE_MERCHANT_ID
        self.pg_provider = settings.PORTONE_PG_PROVIDER
        self.channel_key = settings.PORTONE_CHANNEL_KEY
        self.base_url = "https://api.iamport.kr"
        self._access_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

    def is_configured(self) -> bool:
        """PortOne 설정 완료 여부"""
        return bool(self.api_key and self.api_secret and self.merchant_id)

    async def _get_access_token(self) -> Optional[str]:
        """PortOne REST API 액세스 토큰 발급 (30분 유효)"""
        if self._access_token and self._token_expires_at:
            if datetime.utcnow() < self._token_expires_at:
                return self._access_token

        try:
            async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
                response = await client.post(
                    f"{self.base_url}/users/getToken",
                    json={
                        "imp_key": self.api_key,
                        "imp_secret": self.api_secret,
                    },
                )
                response.raise_for_status()
                data = response.json()

            if data.get("code") != 0:
                logger.error(f"PortOne 토큰 발급 실패: {data.get('message')}")
                return None

            token_data = data.get("response", {})
            self._access_token = token_data.get("access_token")
            expires_at = token_data.get("expired_at", 0)
            self._token_expires_at = datetime.fromtimestamp(expires_at - 300)

            logger.info("PortOne 액세스 토큰 발급 완료")
            return self._access_token

        except Exception as e:
            logger.error(f"PortOne 토큰 발급 오류: {e}", exc_info=True)
            return None

    async def _get_headers(self) -> Dict[str, str]:
        """인증 헤더"""
        token = await self._get_access_token()
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

    def prepare_payment(
        self,
        stock_code: str,
        timeframe: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """결제 준비 - 프론트엔드 SDK에 전달할 정보 생성"""
        merchant_uid = f"analysis_{uuid.uuid4().hex[:16]}"
        amount = settings.ANALYSIS_PRICE_KRW
        product_name = f"주식 딥리서치 분석 - {stock_code}"

        payment_expectation_store.save(
            merchant_uid=merchant_uid,
            expected_amount=amount,
            stock_code=stock_code,
            timeframe=timeframe,
            user_id=user_id,
        )

        return {
            "merchant_uid": merchant_uid,
            "amount": amount,
            "product_name": product_name,
            "merchant_id": self.merchant_id,
            "pg_provider": self.pg_provider,
            "channel_key": self.channel_key,
        }

    async def verify_payment(
        self,
        imp_uid: str,
        merchant_uid: str,
    ) -> Tuple[bool, Optional[PortOnePayment], Optional[str]]:
        """결제 검증 - PortOne API로 실제 결제 정보 조회 후 금액 비교"""
        if not self.is_configured():
            return False, None, "PortOne이 설정되지 않았습니다"

        expectation = payment_expectation_store.get(merchant_uid)
        if not expectation:
            return False, None, f"유효하지 않은 주문번호: {merchant_uid}"

        payment = await self.get_payment_info(imp_uid)
        if not payment:
            return False, None, f"결제 정보를 찾을 수 없습니다: {imp_uid}"

        if payment.status != "paid":
            return False, payment, f"결제가 완료되지 않았습니다. 상태: {payment.status}"

        if payment.amount != expectation.expected_amount:
            logger.error(
                f"금액 위변조 감지! imp_uid={imp_uid}, "
                f"expected={expectation.expected_amount}, actual={payment.amount}"
            )
            await self.cancel_payment(imp_uid, "금액 위변조로 인한 자동 취소")
            return False, payment, "결제 금액이 일치하지 않습니다"

        if payment.merchant_uid != merchant_uid:
            return False, payment, "주문번호가 일치하지 않습니다"

        payment_expectation_store.remove(merchant_uid)
        logger.info(f"결제 검증 성공: imp_uid={imp_uid}, amount={payment.amount}")
        return True, payment, None

    async def get_payment_info(self, imp_uid: str) -> Optional[PortOnePayment]:
        """결제 정보 조회"""
        try:
            headers = await self._get_headers()
            async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
                response = await client.get(
                    f"{self.base_url}/payments/{imp_uid}",
                    headers=headers,
                )
                response.raise_for_status()
                data = response.json()

            if data.get("code") != 0:
                logger.error(f"결제 조회 실패: {data.get('message')}")
                return None

            pd = data.get("response", {})
            return PortOnePayment(
                imp_uid=pd.get("imp_uid", ""),
                merchant_uid=pd.get("merchant_uid", ""),
                amount=pd.get("amount", 0),
                status=pd.get("status", "unknown"),
                pg_provider=pd.get("pg_provider", ""),
                pay_method=pd.get("pay_method", ""),
                paid_at=datetime.fromtimestamp(pd["paid_at"]) if pd.get("paid_at") else None,
                cancelled_at=datetime.fromtimestamp(pd["cancelled_at"]) if pd.get("cancelled_at") else None,
                cancel_amount=pd.get("cancel_amount", 0),
            )

        except Exception as e:
            logger.error(f"결제 조회 오류: {e}", exc_info=True)
            return None

    async def cancel_payment(
        self,
        imp_uid: str,
        reason: str = "서비스 오류",
        amount: Optional[int] = None,
    ) -> Tuple[bool, Optional[int], Optional[str]]:
        """결제 취소 (환불)"""
        try:
            headers = await self._get_headers()
            payload: Dict[str, Any] = {
                "imp_uid": imp_uid,
                "reason": reason,
            }
            if amount is not None:
                payload["amount"] = amount

            async with httpx.AsyncClient(timeout=30.0, verify=False) as client:
                response = await client.post(
                    f"{self.base_url}/payments/cancel",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            if data.get("code") != 0:
                return False, 0, data.get("message")

            cancel_data = data.get("response", {})
            cancelled_amount = cancel_data.get("cancel_amount", 0)

            logger.info(f"결제 취소 완료: imp_uid={imp_uid}, amount={cancelled_amount}")
            return True, cancelled_amount, None

        except Exception as e:
            logger.error(f"결제 취소 오류: {e}", exc_info=True)
            return False, 0, str(e)

    def get_expectation(self, merchant_uid: str) -> Optional[PaymentExpectation]:
        """결제 예상 정보 조회 (분석 실행 시 사용)"""
        return payment_expectation_store.get(merchant_uid)


# 싱글톤 인스턴스
payment_service = PortOnePaymentService()
