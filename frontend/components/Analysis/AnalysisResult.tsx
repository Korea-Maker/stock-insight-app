"use client";

import { cn } from '@/lib/utils';
import type { StockInsight } from '@/types/stock';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Brain,
  Lightbulb,
  Clock,
  Zap,
  FileText,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Disclaimer } from '@/components/Legal';

/**
 * UTC 시간을 KST로 변환하고 포맷팅
 */
const formatTimeKST = (utcDateString: string): { relative: string; absolute: string } => {
  const utcDate = new Date(utcDateString + 'Z');
  const relative = formatDistanceToNow(utcDate, { addSuffix: true, locale: ko });
  const absolute = format(utcDate, 'yyyy.MM.dd HH:mm', { locale: ko }) + ' (KST)';
  return { relative, absolute };
};

interface AnalysisResultProps {
  insight: StockInsight;
  className?: string;
}

const timeframeLabels = {
  short: '단기 (1-3개월)',
  mid: '중기 (3-12개월)',
  long: '장기 (1년+)',
};

const marketLabels = {
  US: '미국',
  KR: '한국',
};

const sentimentLabels = {
  bullish: '강세',
  neutral: '중립',
  bearish: '약세',
};

export function AnalysisResult({ insight, className }: AnalysisResultProps) {
  const formatPrice = (price: number | undefined, market: string) => {
    if (price === undefined) return '-';
    const currency = market === 'KR' ? '₩' : '$';
    const formatted = market === 'KR'
      ? price.toLocaleString('ko-KR')
      : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${currency}${formatted}`;
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const isPositive = (value: number | undefined | null) => {
    return value !== undefined && value !== null && value >= 0;
  };

  const getRecommendationBadge = () => {
    const rec = insight.recommendation;
    if (rec === 'strong_buy' || rec === 'buy') {
      return (
        <span className="badge-success">
          <TrendingUp className="h-4 w-4" />
          {rec === 'strong_buy' ? 'Strong Buy' : 'Buy'}
        </span>
      );
    }
    if (rec === 'strong_sell' || rec === 'sell') {
      return (
        <span className="badge-error">
          <TrendingDown className="h-4 w-4" />
          {rec === 'strong_sell' ? 'Strong Sell' : 'Sell'}
        </span>
      );
    }
    return (
      <span className="badge-neutral">
        <Minus className="h-4 w-4" />
        Hold
      </span>
    );
  };

  const getRiskDots = () => {
    const dots = [];
    for (let i = 1; i <= 10; i++) {
      let className = "risk-dot";
      if (i <= insight.risk_score) {
        if (i <= 3) className += " risk-dot-active-low";
        else if (i <= 6) className += " risk-dot-active-mid";
        else className += " risk-dot-active-high";
      }
      dots.push(<div key={i} className={className} />);
    }
    return dots;
  };

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Stock Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{insight.stock_name}</h2>
            <span className="text-sm text-muted-foreground bg-secondary px-2 py-0.5 rounded">
              {insight.stock_code}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{marketLabels[insight.market as keyof typeof marketLabels] || insight.market}</span>
            <span>·</span>
            <span>{timeframeLabels[insight.timeframe]}</span>
            <span>·</span>
            <span
              className="cursor-help"
              title={formatTimeKST(insight.created_at).absolute}
            >
              {formatTimeKST(insight.created_at).relative}
            </span>
          </div>
        </div>

        {/* Price & Recommendation */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-semibold">
              {formatPrice(insight.current_price, insight.market)}
            </div>
            {insight.price_change_1d !== undefined && (
              <div className={cn(
                "text-sm font-medium",
                isPositive(insight.price_change_1d) ? "text-success" : "text-error"
              )}>
                {formatPercentage(insight.price_change_1d)}
              </div>
            )}
          </div>
          {getRecommendationBadge()}
        </div>
      </div>

      {/* Price Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-secondary/50 rounded-lg">
        <div className="stat-minimal">
          <div className="stat-minimal-label">현재가</div>
          <div className="text-lg font-semibold">
            {formatPrice(insight.current_price, insight.market)}
          </div>
        </div>
        <div className="stat-minimal">
          <div className="stat-minimal-label">1일</div>
          <div className={cn(
            "text-lg font-semibold",
            isPositive(insight.price_change_1d) ? "text-success" : "text-error"
          )}>
            {formatPercentage(insight.price_change_1d)}
          </div>
        </div>
        <div className="stat-minimal">
          <div className="stat-minimal-label">1주</div>
          <div className={cn(
            "text-lg font-semibold",
            isPositive(insight.price_change_1w) ? "text-success" : "text-error"
          )}>
            {formatPercentage(insight.price_change_1w)}
          </div>
        </div>
        <div className="stat-minimal">
          <div className="stat-minimal-label">1개월</div>
          <div className={cn(
            "text-lg font-semibold",
            isPositive(insight.price_change_1m) ? "text-success" : "text-error"
          )}>
            {formatPercentage(insight.price_change_1m)}
          </div>
        </div>
      </div>

      {/* Key Summary */}
      {insight.key_summary && insight.key_summary.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">핵심 포인트</h3>
          </div>
          <ul className="space-y-2">
            {insight.key_summary.map((item, index) => (
              <li key={index} className="flex items-start gap-3 text-muted-foreground">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-sm leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="divider" />

      {/* Risk & Sentiment Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Risk Assessment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">위험도 평가</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="risk-dots">{getRiskDots()}</div>
              <span className="text-lg font-semibold">{insight.risk_score}/10</span>
            </div>

            {insight.risk_analysis && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">변동성</span>
                  <span>{insight.risk_analysis.volatility}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">회사 리스크</span>
                  <span>{insight.risk_analysis.company_specific}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">산업 리스크</span>
                  <span>{insight.risk_analysis.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">거시경제</span>
                  <span>{insight.risk_analysis.macro}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Market Sentiment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">시장 심리</h3>
          </div>

          <div className="space-y-3">
            {insight.market_sentiment && (
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium",
                  insight.market_sentiment === 'bullish' && "bg-[oklch(0.95_0.05_155)] text-[oklch(0.35_0.12_155)] dark:bg-[oklch(0.25_0.08_155)] dark:text-[oklch(0.75_0.12_155)]",
                  insight.market_sentiment === 'neutral' && "bg-secondary text-secondary-foreground",
                  insight.market_sentiment === 'bearish' && "bg-[oklch(0.95_0.05_25)] text-[oklch(0.45_0.15_25)] dark:bg-[oklch(0.25_0.08_25)] dark:text-[oklch(0.75_0.12_25)]",
                )}>
                  {sentimentLabels[insight.market_sentiment]}
                </span>
                <span className="text-sm text-muted-foreground">
                  신뢰도: {insight.confidence_level === 'high' ? '높음' : insight.confidence_level === 'medium' ? '보통' : '낮음'}
                </span>
              </div>
            )}

            {insight.sentiment_details && (
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{insight.sentiment_details.overall}</p>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">기관 투자자</span>
                  <span>{insight.sentiment_details.institutional}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">공매도 비율</span>
                  <span>{insight.sentiment_details.short_interest}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* Investment Decision */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">투자 의사결정</h3>
          </div>
          {getRecommendationBadge()}
        </div>
        <p className="text-muted-foreground leading-relaxed">
          {insight.recommendation_reason}
        </p>
      </div>

      <div className="divider" />

      {/* Deep Research */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">딥리서치 분석</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {insight.deep_research}
        </p>
      </div>

      <div className="divider" />

      {/* Drivers & Catalysts Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Current Drivers */}
        {insight.current_drivers && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">현재 변동 요인</h3>
            </div>
            <div className="space-y-4">
              {insight.current_drivers.news_based && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">뉴스 기반</span>
                  <p className="text-sm text-muted-foreground mt-1">{insight.current_drivers.news_based}</p>
                </div>
              )}
              {insight.current_drivers.technical && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">기술적 요인</span>
                  <p className="text-sm text-muted-foreground mt-1">{insight.current_drivers.technical}</p>
                </div>
              )}
              {insight.current_drivers.fundamental && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">펀더멘털</span>
                  <p className="text-sm text-muted-foreground mt-1">{insight.current_drivers.fundamental}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Future Catalysts */}
        {insight.future_catalysts && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">미래 촉매</h3>
            </div>
            <div className="space-y-4">
              {insight.future_catalysts.short_term && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">단기 (1-3개월)</span>
                  <p className="text-sm text-muted-foreground mt-1">{insight.future_catalysts.short_term}</p>
                </div>
              )}
              {insight.future_catalysts.mid_term && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">중기 (3-12개월)</span>
                  <p className="text-sm text-muted-foreground mt-1">{insight.future_catalysts.mid_term}</p>
                </div>
              )}
              {insight.future_catalysts.long_term && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">장기 (1년+)</span>
                  <p className="text-sm text-muted-foreground mt-1">{insight.future_catalysts.long_term}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <Disclaimer variant="compact" className="mt-8" />

      {/* Footer */}
      <div className="flex items-center justify-end text-xs text-muted-foreground pt-4 border-t border-border">
        <span>분석 소요 시간: {insight.processing_time_ms ? `${(insight.processing_time_ms / 1000).toFixed(1)}초` : '-'}</span>
      </div>
    </div>
  );
}
