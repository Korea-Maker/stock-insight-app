"use client";

import { useState, useCallback } from 'react';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StockInput, TimeframePicker } from '@/components/Stock';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { analyzeStock, getAnalysisById } from '@/lib/api/analysis';
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
    setStockCode,
    setTimeframe,
    setIsAnalyzing,
    setCurrentInsight,
    setError,
  } = useAnalysisStore();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockCode.trim()) {
      setError('종목코드 또는 회사명을 입력해주세요.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      // 분석 실행
      const result = await analyzeStock(stockCode.trim(), timeframe);

      // 분석 결과 상세 조회
      const insight = await getAnalysisById(result.insight_id);
      setCurrentInsight(insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [stockCode, timeframe, setIsAnalyzing, setCurrentInsight, setError]);

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      <StockInput
        value={stockCode}
        onChange={setStockCode}
        disabled={isAnalyzing}
      />

      <TimeframePicker
        value={timeframe}
        onChange={setTimeframe}
        disabled={isAnalyzing}
      />

      <Button
        type="submit"
        size="lg"
        disabled={isAnalyzing || !stockCode.trim()}
        className="w-full py-6 text-lg font-semibold"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            AI 딥리서치 분석 중...
          </>
        ) : (
          <>
            <Search className="mr-2 h-5 w-5" />
            분석 시작
          </>
        )}
      </Button>
    </form>
  );
}
