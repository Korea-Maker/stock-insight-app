/**
 * PortOne SDK 래퍼
 */
import type { PortOnePaymentRequest, PortOnePaymentResponse } from '@/types/payment';

const PORTONE_SDK_URL = 'https://cdn.iamport.kr/v1/iamport.js';

let sdkLoaded = false;
let loadPromise: Promise<void> | null = null;

/**
 * PortOne SDK 로드
 */
export async function loadPortOneSDK(): Promise<void> {
  if (sdkLoaded && window.IMP) {
    return;
  }

  if (loadPromise) {
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    if (window.IMP) {
      sdkLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = PORTONE_SDK_URL;
    script.async = true;

    script.onload = () => {
      sdkLoaded = true;
      resolve();
    };

    script.onerror = () => {
      reject(new Error('PortOne SDK 로드 실패'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * PortOne SDK 초기화
 */
export function initPortOne(merchantId: string): void {
  if (!window.IMP) {
    throw new Error('PortOne SDK가 로드되지 않았습니다');
  }
  window.IMP.init(merchantId);
}

/**
 * 결제 요청
 */
export function requestPayment(
  params: PortOnePaymentRequest
): Promise<PortOnePaymentResponse> {
  return new Promise((resolve) => {
    if (!window.IMP) {
      resolve({
        success: false,
        error_code: 'SDK_NOT_LOADED',
        error_msg: 'PortOne SDK가 로드되지 않았습니다',
      });
      return;
    }

    window.IMP.request_pay(params, (response) => {
      resolve(response);
    });
  });
}

/**
 * PG사별 pg 파라미터 문자열 생성
 */
export function getPgString(pgProvider: string, channelKey?: string): string {
  if (channelKey) {
    return channelKey;
  }

  switch (pgProvider) {
    case 'tosspayments':
      return 'tosspayments';
    case 'kakaopay':
      return 'kakaopay';
    case 'naverpay':
      return 'naverpay';
    default:
      return pgProvider;
  }
}
