"use client";

import { useState, useCallback, useEffect } from 'react';
import { Loader2, ArrowRight, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StockInput, TimeframePicker } from '@/components/Stock';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { analyzeStock, getAnalysisById } from '@/lib/api/analysis';
import { preparePayment, verifyPayment } from '@/lib/api/payment';
import { loadPortOneSDK, initPortOne, requestPayment, getPgString } from '@/lib/portone/sdk';
import type { InvestmentTimeframe } from '@/types/stock';
import { cn } from '@/lib/utils';

interface AnalysisFormProps {
  className?: string;
}

export function AnalysisForm({ className }: AnalysisFormProps) {
  const {
    stockCode,
    timeframe,
    isAnalyzing,
    isPaying,
    setStockCode,
    setTimeframe,
    setIsAnalyzing,
    setIsPaying,
    setMerchantUid,
    setImpUid,
    setCurrentInsight,
    setError,
  } = useAnalysisStore();

  // Preload PortOne SDK on component mount
  useEffect(() => {
    loadPortOneSDK().catch((err) => {
      console.warn('PortOne SDK 사전 로드 실패:', err);
    });
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockCode.trim()) {
      setError('종목코드를 입력하세요.');
      return;
    }

    setError(null);
    setIsPaying(true);

    try {
      // Step 1: Prepare payment - get SDK params from backend
      const paymentData = await preparePayment(stockCode.trim(), timeframe);
      setMerchantUid(paymentData.merchant_uid);

      // Step 2: Load and initialize SDK
      await loadPortOneSDK();
      initPortOne(paymentData.merchant_id);

      // Step 3: Request payment via inline modal
      const pgString = getPgString(paymentData.pg_provider, paymentData.channel_key);
      const paymentResponse = await requestPayment({
        pg: pgString,
        pay_method: 'card',
        merchant_uid: paymentData.merchant_uid,
        name: paymentData.product_name,
        amount: paymentData.amount,
      });

      if (!paymentResponse.success) {
        // User cancelled or payment failed
        const errorMsg = paymentResponse.error_msg || '결제가 취소되었습니다.';
        setError(errorMsg);
        setIsPaying(false);
        setMerchantUid(null);
        return;
      }

      // Step 4: Verify payment with backend
      setImpUid(paymentResponse.imp_uid || null);
      const verifyResponse = await verifyPayment(
        paymentResponse.imp_uid!,
        paymentData.merchant_uid
      );

      if (!verifyResponse.verified || verifyResponse.status !== 'paid') {
        setError('결제 검증에 실패했습니다. 고객센터에 문의해주세요.');
        setIsPaying(false);
        return;
      }

      // Step 5: Payment verified - run analysis
      setIsPaying(false);
      setIsAnalyzing(true);

      const result = await analyzeStock(stockCode.trim(), timeframe, paymentData.merchant_uid);
      const insight = await getAnalysisById(result.insight_id);
      setCurrentInsight(insight);

      // Clear payment state
      setMerchantUid(null);
      setImpUid(null);
    } catch (err) {
      // Check if payment service is not configured (fallback to direct analysis)
      if (err instanceof Error && err.message.includes('결제 서비스가 설정되지 않았습니다')) {
        setIsPaying(false);
        await handleDirectAnalysis();
      } else {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        setIsPaying(false);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [stockCode, timeframe, setIsPaying, setMerchantUid, setImpUid, setIsAnalyzing, setCurrentInsight, setError]);

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

  const isLoading = isAnalyzing || isPaying;

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
        {isPaying ? (
          <>
            <CreditCard className="mr-2 h-5 w-5" />
            결제 진행 중...
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
        분석 1회당 3,900원 · 실패 시 자동 환불
      </p>
    </form>
  );
}
