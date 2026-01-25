"use client";

import { cn } from '@/lib/utils';

interface RiskGaugeProps {
  score: number; // 1-10
  className?: string;
}

export function RiskGauge({ score, className }: RiskGaugeProps) {
  const normalizedScore = Math.max(1, Math.min(10, score));
  const percentage = (normalizedScore / 10) * 100;

  const getRiskLevel = (score: number) => {
    if (score <= 3) return { label: '낮음', color: 'bg-emerald-500', textColor: 'text-emerald-500' };
    if (score <= 6) return { label: '보통', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
    return { label: '높음', color: 'bg-red-500', textColor: 'text-red-500' };
  };

  const riskLevel = getRiskLevel(normalizedScore);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">위험도</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-2xl font-bold", riskLevel.textColor)}>
            {normalizedScore}
          </span>
          <span className="text-sm text-muted-foreground">/ 10</span>
        </div>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-full transition-all duration-500",
            riskLevel.color
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>낮음</span>
        <span className={cn("font-medium", riskLevel.textColor)}>{riskLevel.label}</span>
        <span>높음</span>
      </div>
    </div>
  );
}
