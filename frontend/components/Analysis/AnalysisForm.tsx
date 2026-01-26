"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Search, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StockInput, TimeframePicker } from '@/components/Stock';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { analyzeStock, getAnalysisById, createCheckout, getCheckoutStatus } from '@/lib/api/analysis';
import type { InvestmentTimeframe } from '@/types/stock';
import { cn } from '@/lib/utils';

interface AnalysisFormProps {
  className?: string;
}

export function AnalysisForm({ className }: AnalysisFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    stockCode,
    timeframe,
    isAnalyzing,
    isCheckingOut,
    checkoutId,
    setStockCode,
    setTimeframe,
    setIsAnalyzing,
    setIsCheckingOut,
    setCheckoutId,
    setCurrentInsight,
    setError,
  } = useAnalysisStore();

  // URL에서 결제 완료 파라미터 확인
  useEffect(() => {
    const checkoutIdFromUrl = searchParams.get('checkout_id');
    const stockCodeFromUrl = searchParams.get('stock_code');
    const timeframeFromUrl = searchParams.get('timeframe') as InvestmentTimeframe | null;

    if (checkoutIdFromUrl && stockCodeFromUrl && timeframeFromUrl) {
      // 결제 완료 후 자동 분석 실행
      handleAnalysisAfterPayment(checkoutIdFromUrl, stockCodeFromUrl, timeframeFromUrl);

      // URL에서 파라미터 제거
      router.replace('/dashboard', { scroll: false });
    }
  }, [searchParams]);

  const handleAnalysisAfterPayment = async (
    paidCheckoutId: string,
    paidStockCode: string,
    paidTimeframe: InvestmentTimeframe
  ) => {
    setStockCode(paidStockCode);
    setTimeframe(paidTimeframe);
    setError(null);
    setIsAnalyzing(true);

    try {
      // 결제 상태 확인
      const status = await getCheckoutStatus(paidCheckoutId);

      if (!status.is_completed) {
        setError('결제가 완료되지 않았습니다. 다시 시도해주세요.');
        return;
      }

      // 분석 실행 (checkout_id 포함)
      const result = await analyzeStock(paidStockCode, paidTimeframe, paidCheckoutId);

      // 분석 결과 상세 조회
      const insight = await getAnalysisById(result.insight_id);
      setCurrentInsight(insight);
      setCheckoutId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockCode.trim()) {
      setError('종목코드 또는 회사명을 입력해주세요.');
      return;
    }

    setError(null);
    setIsCheckingOut(true);

    try {
      // 결제 성공 후 리다이렉트 URL 생성
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const successUrl = `${currentUrl}/dashboard?checkout_id={CHECKOUT_ID}&stock_code=${encodeURIComponent(stockCode.trim())}&timeframe=${timeframe}`;
      const cancelUrl = `${currentUrl}/dashboard`;

      // 결제 체크아웃 세션 생성
      const checkout = await createCheckout(
        stockCode.trim(),
        timeframe,
        successUrl,
        cancelUrl
      );

      setCheckoutId(checkout.checkout_id);

      // 결제 페이지로 리다이렉트
      window.location.href = checkout.checkout_url;
    } catch (err) {
      // 결제 서비스가 설정되지 않은 경우 (개발 모드) 바로 분석 실행
      if (err instanceof Error && err.message.includes('결제 서비스가 설정되지 않았습니다')) {
        setIsCheckingOut(false);
        await handleDirectAnalysis();
      } else {
        setError(err instanceof Error ? err.message : '결제 세션 생성 중 오류가 발생했습니다.');
        setIsCheckingOut(false);
      }
    }
  }, [stockCode, timeframe, setIsCheckingOut, setCheckoutId, setError]);

  // 결제 없이 직접 분석 (개발/테스트용)
  const handleDirectAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeStock(stockCode.trim(), timeframe);
      const insight = await getAnalysisById(result.insight_id);
      setCurrentInsight(insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isLoading = isAnalyzing || isCheckingOut;

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <StockInput
        value={stockCode}
        onChange={setStockCode}
        disabled={isLoading}
      />

      <TimeframePicker
        value={timeframe}
        onChange={setTimeframe}
        disabled={isLoading}
      />

      <Button
        type="submit"
        size="lg"
        disabled={isLoading || !stockCode.trim()}
        className="w-full py-6 text-lg font-semibold"
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            결제 페이지로 이동 중...
          </>
        ) : isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            AI 딥리서치 분석 중...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            분석 시작 (결제)
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        분석 1회당 결제가 진행됩니다
      </p>
    </form>
  );
}
