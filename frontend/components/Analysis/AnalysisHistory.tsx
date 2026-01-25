"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { RecommendationBadge } from './RecommendationBadge';
import { getAnalysisHistory } from '@/lib/api/analysis';
import type { StockInsightSummary } from '@/types/stock';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock, TrendingUp, AlertCircle, Loader2 } from 'lucide-react';

interface AnalysisHistoryProps {
  limit?: number;
  className?: string;
}

const timeframeLabels = {
  short: '단기',
  mid: '중기',
  long: '장기',
};

const marketLabels = {
  US: '미국',
  KR: '한국',
};

/**
 * UTC 시간을 KST로 변환하고 포맷팅
 * @param utcDateString UTC 시간 문자열
 * @returns 포맷팅된 시간 문자열
 */
const formatTimeKST = (utcDateString: string): { relative: string; absolute: string } => {
  // 서버에서 오는 시간이 UTC라고 가정하고 KST로 변환
  const utcDate = new Date(utcDateString + 'Z'); // 'Z'를 추가하여 UTC로 명시

  const relative = formatDistanceToNow(utcDate, { addSuffix: true, locale: ko });
  const absolute = format(utcDate, 'yyyy.MM.dd HH:mm', { locale: ko }) + ' (KST)';

  return { relative, absolute };
};

export function AnalysisHistory({ limit = 5, className }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<StockInsightSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await getAnalysisHistory(undefined, limit);
        setHistory(data.items);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '이력을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [limit]);

  const formatPrice = (price: number | undefined, market: string) => {
    if (price === undefined) return '-';
    const currency = market === 'KR' ? 'KRW' : 'USD';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: market === 'KR' ? 0 : 2,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-center", className)}>
        <TrendingUp className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">아직 분석 기록이 없습니다.</p>
        <p className="text-xs text-muted-foreground mt-1">첫 번째 분석을 시작해보세요!</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {history.map((item) => {
        const timeInfo = formatTimeKST(item.created_at);

        return (
          <Link key={item.id} href={`/analysis/${item.id}`} className="block">
            <Card className="p-4 hover:bg-muted/50 hover:shadow-md transition-all cursor-pointer border shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{item.stock_name}</h3>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                      {item.stock_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{marketLabels[item.market as keyof typeof marketLabels] || item.market}</span>
                    <span>|</span>
                    <span>{timeframeLabels[item.timeframe]}</span>
                    <span>|</span>
                    <span
                      className="flex items-center gap-1 cursor-help"
                      title={timeInfo.absolute}
                    >
                      <Clock className="h-3 w-3" />
                      {timeInfo.relative}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 ml-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {formatPrice(item.current_price, item.market)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      위험도: {item.risk_score}/10
                    </div>
                  </div>
                  <RecommendationBadge
                    recommendation={item.recommendation}
                    size="sm"
                    showLabel={false}
                  />
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
