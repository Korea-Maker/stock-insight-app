"""
Lemon Squeezy 결제 서비스
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


class LemonSqueezyPaymentService:
    """Lemon Squeezy 결제 서비스"""

    def __init__(self):
        self.api_key = settings.LEMONSQUEEZY_API_KEY
        self.store_id = settings.LEMONSQUEEZY_STORE_ID
        self.variant_id = settings.LEMONSQUEEZY_VARIANT_ID
        self.base_url = "https://api.lemonsqueezy.com/v1"

    @property
    def headers(self) -> Dict[str, str]:
        """API 요청 헤더"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/vnd.api+json",
            "Accept": "application/vnd.api+json",
        }

    def is_configured(self) -> bool:
        """Lemon Squeezy 설정이 완료되었는지 확인"""
        return bool(self.api_key and self.store_id and self.variant_id)

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
            logger.error("Lemon Squeezy API가 설정되지 않았습니다.")
            return None

        try:
            # Lemon Squeezy 체크아웃 생성 페이로드
            payload = {
                "data": {
                    "type": "checkouts",
                    "attributes": {
                        "checkout_options": {
                            "embed": False,
                            "media": True,
                            "logo": True,
                        },
                        "checkout_data": {
                            "custom": metadata or {},
                        },
                        "product_options": {
                            "redirect_url": success_url,
                        },
                        "expires_at": None,  # 만료 시간 없음
                    },
                    "relationships": {
                        "store": {
                            "data": {
                                "type": "stores",
                                "id": self.store_id,
                            }
                        },
                        "variant": {
                            "data": {
                                "type": "variants",
                                "id": self.variant_id,
                            }
                        },
                    },
                }
            }

            logger.info(f"Lemon Squeezy 체크아웃 생성 요청: store_id={self.store_id}, variant_id={self.variant_id}")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/checkouts",
                    headers=self.headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            # Lemon Squeezy 응답 구조 파싱
            checkout_data = data.get("data", {})
            attributes = checkout_data.get("attributes", {})
            checkout_id = checkout_data.get("id")
            checkout_url = attributes.get("url")

            if not checkout_id or not checkout_url:
                logger.error(f"Lemon Squeezy 응답에서 필수 필드 누락: {data}")
                return None

            checkout = CheckoutSession(
                id=checkout_id,
                url=checkout_url,
                client_secret="",  # Lemon Squeezy는 client_secret 미사용
                status="pending",
                product_id=self.variant_id,
                amount=None,  # 응답에 포함될 수 있음
                currency=None,
            )

            logger.info(f"체크아웃 세션 생성 완료: {checkout.id}")
            return checkout

        except httpx.HTTPStatusError as e:
            logger.error(f"Lemon Squeezy API HTTP 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"체크아웃 세션 생성 실패: {e}", exc_info=True)
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
            logger.error("Lemon Squeezy API가 설정되지 않았습니다.")
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"{self.base_url}/checkouts/{checkout_id}",
                    headers=self.headers,
                )
                response.raise_for_status()
                data = response.json()

            # Lemon Squeezy 응답 구조 반환
            return data.get("data")

        except httpx.HTTPStatusError as e:
            logger.error(f"체크아웃 조회 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"체크아웃 조회 실패: {e}", exc_info=True)
            return None

    async def verify_checkout_completed(self, checkout_id: str) -> bool:
        """
        결제 완료 여부 확인

        Args:
            checkout_id: 체크아웃 세션 ID

        Returns:
            결제 완료 여부
        """
        # Lemon Squeezy는 주문(order)을 통해 결제 완료 확인
        order = await self.get_order_by_checkout_id(checkout_id)
        if not order:
            logger.warning(f"checkout_id={checkout_id}에 대한 주문을 찾을 수 없습니다.")
            return False

        # 주문 상태 확인
        attributes = order.get("attributes", {})
        status = attributes.get("status", "")

        # Lemon Squeezy 주문 상태: pending, paid, refunded, cancelled, chargeback
        is_completed = status in ("paid",)
        logger.info(f"checkout_id={checkout_id} 주문 상태: {status}, 완료 여부: {is_completed}")

        return is_completed

    async def get_order_by_checkout_id(self, checkout_id: str) -> Optional[Dict[str, Any]]:
        """
        체크아웃 ID로 주문 조회

        Args:
            checkout_id: 체크아웃 세션 ID

        Returns:
            주문 정보 또는 None
        """
        if not self.is_configured():
            logger.error("Lemon Squeezy API가 설정되지 않았습니다.")
            return None

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 주문 목록에서 checkout_id로 필터링
                response = await client.get(
                    f"{self.base_url}/orders",
                    headers=self.headers,
                    params={"filter[checkout_id]": checkout_id},
                )
                response.raise_for_status()
                data = response.json()

            items = data.get("data", [])
            if items:
                logger.info(f"checkout_id={checkout_id}에 대한 주문 발견: order_id={items[0].get('id')}")
                return items[0]  # 첫 번째 주문 반환

            logger.warning(f"checkout_id={checkout_id}에 대한 주문이 없습니다.")
            return None

        except httpx.HTTPStatusError as e:
            logger.error(f"주문 조회 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"주문 조회 실패: {e}", exc_info=True)
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
            reason: 환불 사유
            comment: 추가 코멘트

        Returns:
            환불 정보 또는 None
        """
        if not self.is_configured():
            logger.error("Lemon Squeezy API가 설정되지 않았습니다.")
            return None

        try:
            # Lemon Squeezy는 전액 환불만 지원
            payload = {
                "data": {
                    "type": "refunds",
                    "attributes": {
                        "amount": amount,
                    },
                    "relationships": {
                        "order": {
                            "data": {
                                "type": "orders",
                                "id": order_id,
                            }
                        }
                    }
                }
            }

            logger.info(f"환불 생성 요청: order_id={order_id}, amount={amount}")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/refunds",
                    headers=self.headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            refund_data = data.get("data", {})
            refund_id = refund_data.get("id")

            logger.info(f"환불 생성 완료: order_id={order_id}, refund_id={refund_id}, amount={amount}")
            return refund_data

        except httpx.HTTPStatusError as e:
            logger.error(f"환불 생성 오류: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"환불 생성 실패: {e}", exc_info=True)
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
            reason: 환불 사유
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

        attributes = order.get("attributes", {})

        # 이미 환불된 경우 체크
        refunded = attributes.get("refunded", False)
        refunded_at = attributes.get("refunded_at")

        if refunded or refunded_at:
            logger.info(f"이미 환불된 주문입니다: order_id={order_id}")
            return True

        # 환불 금액 (Lemon Squeezy는 전액 환불)
        total = attributes.get("total", 0)
        if total == 0:
            logger.error(f"환불 실패: 주문 금액이 0입니다. order_id={order_id}")
            return False

        # 2. 환불 생성
        refund = await self.create_refund(order_id, total, reason, comment)
        return refund is not None


# 싱글톤 인스턴스
payment_service = LemonSqueezyPaymentService()
