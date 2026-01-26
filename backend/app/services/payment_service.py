"""
Polar 결제 서비스
분석 요청 시 결제 체크아웃 세션을 생성합니다.
"""
import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class CheckoutSession:
    """체크아웃 세션 정보"""
    id: str
    url: str
    client_secret: str
    status: str
    product_id: str
    amount: Optional[int] = None
    currency: Optional[str] = None


class PolarPaymentService:
    """Polar 결제 서비스"""

    def __init__(self):
        self.api_key = settings.POLAR_API_KEY
        self.base_url = settings.POLAR_BASE_URL
        self.product_id = settings.POLAR_PRODUCT_ID

    @property
    def headers(self) -> Dict[str, str]:
        """API 요청 헤더"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def is_configured(self) -> bool:
        """Polar 설정이 완료되었는지 확인"""
        return bool(self.api_key and self.product_id)

    async def create_checkout_session(
        self,
        success_url: str,
        cancel_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[CheckoutSession]:
        """
        결제 체크아웃 세션 생성

        Args:
            success_url: 결제 성공 후 리다이렉트 URL
            cancel_url: 결제 취소 시 리다이렉트 URL
            metadata: 추가 메타데이터 (예: stock_code, timeframe)

        Returns:
            CheckoutSession 또는 None
        """
        if not self.is_configured():
            logger.error("Polar API가 설정되지 않았습니다.")
            return None

        try:
            payload = {
                "products": [self.product_id],
                "success_url": success_url,
            }

            if cancel_url:
                payload["cancel_url"] = cancel_url

            if metadata:
                payload["metadata"] = metadata

            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/checkouts/",
                    headers=self.headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            checkout = CheckoutSession(
                id=data.get("id"),
                url=data.get("url"),
                client_secret=data.get("client_secret", ""),
                status=data.get("status", "open"),
                product_id=self.product_id,
                amount=data.get("amount"),
                currency=data.get("currency"),
            )

            logger.info(f"체크아웃 세션 생성 완료: {checkout.id}")
            return checkout

        except httpx.HTTPStatusError as e:
            logger.error(f"Polar API HTTP 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"체크아웃 세션 생성 실패: {e}")
            return None

    async def get_checkout_session(self, checkout_id: str) -> Optional[Dict[str, Any]]:
        """
        체크아웃 세션 조회

        Args:
            checkout_id: 체크아웃 세션 ID

        Returns:
            세션 정보 또는 None
        """
        if not self.is_configured():
            return None

        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/checkouts/{checkout_id}",
                    headers=self.headers,
                )
                response.raise_for_status()
                return response.json()

        except httpx.HTTPStatusError as e:
            logger.error(f"체크아웃 조회 오류: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"체크아웃 조회 실패: {e}")
            return None

    async def verify_checkout_completed(self, checkout_id: str) -> bool:
        """
        결제 완료 여부 확인

        Args:
            checkout_id: 체크아웃 세션 ID

        Returns:
            결제 완료 여부
        """
        session = await self.get_checkout_session(checkout_id)
        if not session:
            return False

        # 'succeeded' 또는 'confirmed' 상태 확인
        status = session.get("status", "")
        return status in ("succeeded", "confirmed", "completed")

    async def get_order_by_checkout_id(self, checkout_id: str) -> Optional[Dict[str, Any]]:
        """
        체크아웃 ID로 주문 조회

        Args:
            checkout_id: 체크아웃 세션 ID

        Returns:
            주문 정보 또는 None
        """
        if not self.is_configured():
            return None

        try:
            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                # 주문 목록에서 checkout_id로 필터링
                response = await client.get(
                    f"{self.base_url}/orders/",
                    headers=self.headers,
                    params={"checkout_id": checkout_id},
                )
                response.raise_for_status()
                data = response.json()

            items = data.get("items", [])
            if items:
                return items[0]  # 첫 번째 주문 반환

            return None

        except httpx.HTTPStatusError as e:
            logger.error(f"주문 조회 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"주문 조회 실패: {e}")
            return None

    async def create_refund(
        self,
        order_id: str,
        amount: int,
        reason: str = "service_disruption",
        comment: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        환불 생성

        Args:
            order_id: 주문 ID
            amount: 환불 금액 (센트 단위)
            reason: 환불 사유 (duplicate, fraudulent, customer_request,
                    service_disruption, satisfaction_guarantee, dispute_prevention, other)
            comment: 추가 코멘트

        Returns:
            환불 정보 또는 None
        """
        if not self.is_configured():
            return None

        try:
            payload = {
                "order_id": order_id,
                "amount": amount,
                "reason": reason,
            }

            if comment:
                payload["comment"] = comment

            async with httpx.AsyncClient(verify=False, timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/refunds/",
                    headers=self.headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            logger.info(f"환불 생성 완료: order_id={order_id}, refund_id={data.get('id')}, amount={amount}")
            return data

        except httpx.HTTPStatusError as e:
            logger.error(f"환불 생성 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"환불 생성 실패: {e}")
            return None

    async def refund_by_checkout_id(
        self,
        checkout_id: str,
        reason: str = "service_disruption",
        comment: Optional[str] = None,
    ) -> bool:
        """
        체크아웃 ID로 환불 처리

        Args:
            checkout_id: 체크아웃 세션 ID
            reason: 환불 사유 (duplicate, fraudulent, customer_request,
                    service_disruption, satisfaction_guarantee, dispute_prevention, other)
            comment: 추가 코멘트

        Returns:
            환불 성공 여부
        """
        # 1. checkout_id로 주문 조회
        order = await self.get_order_by_checkout_id(checkout_id)
        if not order:
            logger.error(f"환불 실패: checkout_id={checkout_id}에 해당하는 주문을 찾을 수 없습니다.")
            return False

        order_id = order.get("id")
        if not order_id:
            logger.error(f"환불 실패: 주문 ID를 찾을 수 없습니다.")
            return False

        # 이미 환불된 경우 체크
        refunded_amount = order.get("refunded_amount", 0)
        net_amount = order.get("net_amount", 0)

        if refunded_amount >= net_amount:
            logger.info(f"이미 전액 환불된 주문입니다: order_id={order_id}")
            return True

        # 환불 가능 금액 계산
        refundable_amount = net_amount - refunded_amount

        # 2. 환불 생성
        refund = await self.create_refund(order_id, refundable_amount, reason, comment)
        return refund is not None


# 싱글톤 인스턴스
payment_service = PolarPaymentService()
