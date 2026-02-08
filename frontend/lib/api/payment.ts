/**
 * PortOne 결제 API 클라이언트
 */
import type {
  PreparePaymentRequest,
  PreparePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '@/types/payment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * 사용자 ID 가져오기 (localStorage 기반)
 */
function getUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';

  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = `user_${crypto.randomUUID()}`;
    localStorage.setItem('user_id', userId);
  }
  return userId;
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
  };
}

/**
 * 결제 준비 - SDK 초기화 정보 요청
 */
export async function preparePayment(
  stockCode: string,
  timeframe: string
): Promise<PreparePaymentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payment/prepare`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      stock_code: stockCode,
      timeframe: timeframe,
    } as PreparePaymentRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || '결제 준비 중 오류가 발생했습니다');
  }

  return response.json();
}

/**
 * 결제 검증 - SDK 콜백 후 서버 검증
 */
export async function verifyPayment(
  impUid: string,
  merchantUid: string
): Promise<VerifyPaymentResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      imp_uid: impUid,
      merchant_uid: merchantUid,
    } as VerifyPaymentRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || '결제 검증 중 오류가 발생했습니다');
  }

  return response.json();
}
