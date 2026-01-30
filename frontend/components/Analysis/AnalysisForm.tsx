"use client";

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
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

  // URL에서 결제 완료 파라미터 확인 (Lemon Squeezy 리다이렉트)
  useEffect(() => {
    const checkoutIdFromUrl = searchParams.get('checkout_id');
    const stockCodeFromUrl = searchParams.get('stock_code');
    const timeframeFromUrl = searchParams.get('timeframe') as InvestmentTimeframe | null;

    if (checkoutIdFromUrl && stockCodeFromUrl && timeframeFromUrl) {
      handleAnalysisAfterPayment(checkoutIdFromUrl, stockCodeFromUrl, timeframeFromUrl);
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
      const status = await getCheckoutStatus(paidCheckoutId);
      if (!status.is_completed) {
        setError('결제가 완료되지 않았습니다.');
        return;
      }

      const result = await analyzeStock(paidStockCode, paidTimeframe, paidCheckoutId);
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
      setError('종목코드를 입력하세요.');
      return;
    }

    setError(null);
    setIsCheckingOut(true);

    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const successUrl = `${currentUrl}/dashboard?checkout_id={CHECKOUT_ID}&stock_code=${encodeURIComponent(stockCode.trim())}&timeframe=${timeframe}`;
      const cancelUrl = `${currentUrl}/dashboard`;

      const checkout = await createCheckout(stockCode.trim(), timeframe, successUrl, cancelUrl);
      setCheckoutId(checkout.checkout_id);
      window.location.href = checkout.checkout_url;
    } catch (err) {
      if (err instanceof Error && err.message.includes('결제 서비스가 설정되지 않았습니다')) {
        setIsCheckingOut(false);
        await handleDirectAnalysis();
      } else {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        setIsCheckingOut(false);
      }
    }
  }, [stockCode, timeframe, setIsCheckingOut, setCheckoutId, setError]);

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
      {/* Stock Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">종목코드 / 회사명</label>
        <StockInput
          value={stockCode}
          onChange={setStockCode}
          disabled={isLoading}
        />
      </div>

      {/* Timeframe */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">투자 기간</label>
        <TimeframePicker
          value={timeframe}
          onChange={setTimeframe}
          disabled={isLoading}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !stockCode.trim()}
        className="w-full h-12 rounded-lg text-base"
      >
        {isCheckingOut ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            결제 처리 중...
          </>
        ) : isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            분석 중...
          </>
        ) : (
          <>
            분석 시작
            <ArrowRight className="ml-2 h-5 w-5" />
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        분석 1회당 결제 · 실패 시 자동 환불
      </p>
    </form>
  );
}
