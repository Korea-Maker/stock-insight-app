"use client";

import { cn } from '@/lib/utils';
import type { TradingRecommendation, ConfidenceLevel } from '@/types/stock';
import { TrendingUp, TrendingDown, Minus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface RecommendationBadgeProps {
  recommendation: TradingRecommendation;
  confidenceLevel?: ConfidenceLevel;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const recommendationConfig = {
  strong_buy: {
    label: '적극매입',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    icon: ArrowUpCircle,
  },
  buy: {
    label: '매입',
    color: 'bg-green-500',
    textColor: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    icon: TrendingUp,
  },
  hold: {
    label: '홀드',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    icon: Minus,
  },
  sell: {
    label: '매도',
    color: 'bg-orange-500',
    textColor: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    icon: TrendingDown,
  },
  strong_sell: {
    label: '적극매도',
    color: 'bg-red-500',
    textColor: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    icon: ArrowDownCircle,
  },
};

const confidenceLabels = {
  low: '낮음',
  medium: '보통',
  high: '높음',
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function RecommendationBadge({
  recommendation,
  confidenceLevel,
  showLabel = true,
  size = 'md',
  className,
}: RecommendationBadgeProps) {
  const config = recommendationConfig[recommendation];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border font-semibold",
          config.bgColor,
          config.borderColor,
          config.textColor,
          sizeConfig[size]
        )}
      >
        <Icon className={cn("h-4 w-4", size === 'lg' && "h-5 w-5")} />
        {showLabel && <span>{config.label}</span>}
      </div>
      {confidenceLevel && (
        <span className="text-xs text-muted-foreground">
          신뢰도: {confidenceLabels[confidenceLevel]}
        </span>
      )}
    </div>
  );
}
