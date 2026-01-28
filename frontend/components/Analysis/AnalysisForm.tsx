"use client";

import { useCallback } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StockInput, TimeframePicker } from '@/components/Stock';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { analyzeStock, getAnalysisById } from '@/lib/api/analysis';
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
      setError('종목코드를 입력하세요.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeStock(stockCode.trim(), timeframe);
      const insight = await getAnalysisById(result.insight_id);
      setCurrentInsight(insight);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [stockCode, timeframe, setError, setIsAnalyzing, setCurrentInsight]);

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Stock Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">종목코드 / 회사명</label>
        <StockInput
          value={stockCode}
          onChange={setStockCode}
          disabled={isAnalyzing}
        />
      </div>

      {/* Timeframe */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">투자 기간</label>
        <TimeframePicker
          value={timeframe}
          onChange={setTimeframe}
          disabled={isAnalyzing}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isAnalyzing || !stockCode.trim()}
        className="w-full h-12 rounded-lg text-base"
      >
        {isAnalyzing ? (
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
        무료 AI 분석 · US 주식 지원
      </p>
    </form>
  );
}
