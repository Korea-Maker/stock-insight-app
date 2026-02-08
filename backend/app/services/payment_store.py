"""
결제 준비 정보 임시 저장소
결제 검증 시 금액 위변조 방지를 위해 서버에서 예상 금액을 저장
"""
from typing import Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
import threading


@dataclass
class PaymentExpectation:
    """결제 예상 정보"""
    merchant_uid: str
    expected_amount: int
    stock_code: str
    timeframe: str
    user_id: str
    created_at: datetime
    expires_at: datetime


class PaymentExpectationStore:
    """
    인메모리 결제 예상 정보 저장소

    주의: 프로덕션에서는 Redis 등 외부 저장소 사용 권장
    """

    def __init__(self, ttl_minutes: int = 30):
        self._store: Dict[str, PaymentExpectation] = {}
        self._lock = threading.Lock()
        self._ttl = timedelta(minutes=ttl_minutes)

    def save(
        self,
        merchant_uid: str,
        expected_amount: int,
        stock_code: str,
        timeframe: str,
        user_id: str,
    ) -> PaymentExpectation:
        """결제 예상 정보 저장"""
        now = datetime.utcnow()
        expectation = PaymentExpectation(
            merchant_uid=merchant_uid,
            expected_amount=expected_amount,
            stock_code=stock_code,
            timeframe=timeframe,
            user_id=user_id,
            created_at=now,
            expires_at=now + self._ttl,
        )

        with self._lock:
            self._store[merchant_uid] = expectation
            self._cleanup_expired()

        return expectation

    def get(self, merchant_uid: str) -> Optional[PaymentExpectation]:
        """결제 예상 정보 조회"""
        with self._lock:
            expectation = self._store.get(merchant_uid)
            if expectation and expectation.expires_at > datetime.utcnow():
                return expectation
            return None

    def remove(self, merchant_uid: str) -> bool:
        """결제 예상 정보 삭제"""
        with self._lock:
            if merchant_uid in self._store:
                del self._store[merchant_uid]
                return True
            return False

    def _cleanup_expired(self):
        """만료된 항목 정리"""
        now = datetime.utcnow()
        expired = [k for k, v in self._store.items() if v.expires_at <= now]
        for k in expired:
            del self._store[k]


# 싱글톤 인스턴스
payment_expectation_store = PaymentExpectationStore()
