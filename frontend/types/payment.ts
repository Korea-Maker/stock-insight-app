/**
 * PortOne 결제 관련 타입 정의
 */

export interface PreparePaymentRequest {
  stock_code: string;
  timeframe: string;
}

export interface PreparePaymentResponse {
  merchant_uid: string;
  amount: number;
  product_name: string;
  merchant_id: string;
  pg_provider: string;
  channel_key?: string;
}

export interface VerifyPaymentRequest {
  imp_uid: string;
  merchant_uid: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  imp_uid: string;
  merchant_uid: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'cancelled';
  paid_at?: string;
}

export interface PortOnePaymentRequest {
  pg: string;
  pay_method: string;
  merchant_uid: string;
  name: string;
  amount: number;
  buyer_email?: string;
  buyer_name?: string;
  buyer_tel?: string;
  m_redirect_url?: string;
}

export interface PortOnePaymentResponse {
  success: boolean;
  imp_uid?: string;
  merchant_uid?: string;
  error_code?: string;
  error_msg?: string;
}

// PortOne SDK 글로벌 타입 선언
declare global {
  interface Window {
    IMP?: {
      init: (merchantId: string) => void;
      request_pay: (
        params: PortOnePaymentRequest,
        callback: (response: PortOnePaymentResponse) => void
      ) => void;
    };
  }
}

export {};
