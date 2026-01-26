/**
 * Stock Analysis API 클라이언트
 * AI 주식 딥리서치 분석 데이터 조회
 */

import type {
  StockInsight,
  StockInsightListResponse,
  StockAnalysisRequest,
  AnalysisTriggerResponse,
  InvestmentTimeframe,
  StockSearchResult,
} from '@/types/stock';
import { getUserId } from '../utils/userId';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * 인증 헤더가 포함된 기본 헤더 생성
 */
function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-Id': getUserId(),
  };
}

// 결제 관련 타입
export interface CheckoutRequest {
  stock_code: string;
  timeframe: string;
  success_url: string;
  cancel_url?: string;
}

export interface CheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  status: string;
}

export interface CheckoutStatusResponse {
  checkout_id: string;
  status: string;
  is_completed: boolean;
}

/**
 * 결제 체크아웃 세션 생성
 * @param stockCode 종목코드
 * @param timeframe 투자 기간
 * @param successUrl 결제 성공 후 리다이렉트 URL
 * @param cancelUrl 결제 취소 시 리다이렉트 URL
 */
export async function createCheckout(
  stockCode: string,
  timeframe: string,
  successUrl: string,
  cancelUrl?: string
): Promise<CheckoutResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payment/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      stock_code: stockCode,
      timeframe: timeframe,
      success_url: successUrl,
      cancel_url: cancelUrl,
    } as CheckoutRequest),
  });

  if (!response.ok) {
    let errorMessage = '결제 세션 생성 중 오류가 발생했습니다';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * 결제 상태 확인
 * @param checkoutId 체크아웃 ID
 */
export async function getCheckoutStatus(checkoutId: string): Promise<CheckoutStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/payment/checkout/${checkoutId}/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = '결제 상태 확인 중 오류가 발생했습니다';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * 주식 딥리서치 분석 실행
 * @param stockCode 종목코드 또는 회사명
 * @param timeframe 투자 기간
 * @param checkoutId 결제 체크아웃 ID (선택적)
 */
export async function analyzeStock(
  stockCode: string,
  timeframe: InvestmentTimeframe,
  checkoutId?: string
): Promise<AnalysisTriggerResponse> {
  const response = await fetch(`${API_BASE_URL}/api/analysis/stock`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      stock_code: stockCode,
      timeframe: timeframe,
      checkout_id: checkoutId,
    }),
  });

  if (!response.ok) {
    let errorMessage = '분석 중 오류가 발생했습니다';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * 분석 ID로 조회
 * @param insightId 분석 ID
 */
export async function getAnalysisById(insightId: number): Promise<StockInsight> {
  const response = await fetch(`${API_BASE_URL}/api/analysis/${insightId}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    let errorMessage = '분석 데이터를 가져오는 중 오류가 발생했습니다';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * 최신 분석 조회
 * @param stockCode 종목코드
 */
export async function getLatestAnalysis(stockCode: string): Promise<StockInsight> {
  const params = new URLSearchParams({ stock_code: stockCode });
  const url = `${API_BASE_URL}/api/analysis/latest?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    let errorMessage = '분석 데이터를 가져오는 중 오류가 발생했습니다';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * 분석 이력 조회
 * @param stockCode 종목코드 (선택적)
 * @param limit 조회 개수 (기본값: 20)
 * @param skip 건너뛸 개수 (기본값: 0)
 */
export async function getAnalysisHistory(
  stockCode?: string,
  limit?: number,
  skip?: number
): Promise<StockInsightListResponse> {
  const params = new URLSearchParams();
  if (stockCode) {
    params.append('stock_code', stockCode);
  }
  if (limit !== undefined) {
    params.append('limit', String(limit));
  }
  if (skip !== undefined) {
    params.append('skip', String(skip));
  }

  const queryString = params.toString();
  const url = `${API_BASE_URL}/api/analysis/history${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    let errorMessage = '분석 이력을 가져오는 중 오류가 발생했습니다';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * 종목 검색
 * @param query 검색어
 */
export async function searchStock(query: string): Promise<StockSearchResult[]> {
  const params = new URLSearchParams({ query });
  const url = `${API_BASE_URL}/api/analysis/search/stock?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = '종목 검색 중 오류가 발생했습니다';
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorMessage;
    } catch {
      // JSON 파싱 실패 시 기본 메시지 사용
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.results;
}
