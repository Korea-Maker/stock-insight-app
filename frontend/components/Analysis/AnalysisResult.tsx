"use client";

import { cn } from '@/lib/utils';
import type { StockInsight } from '@/types/stock';
import { RecommendationBadge } from './RecommendationBadge';
import { RiskGauge } from './RiskGauge';
import { SectionCard, KeyValueItem, TextContent } from './SectionCard';
import {
  FileText,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Brain,
  Lightbulb,
  Clock,
  Zap,
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
    const currency = market === 'KR' ? 'KRW' : 'USD';
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency,
      maximumFractionDigits: market === 'KR' ? 0 : 2,
    }).format(price);
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null) return '-';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">{insight.stock_name}</h2>
            <span className="px-2 py-0.5 rounded-full bg-muted text-sm font-medium">
              {insight.stock_code}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{marketLabels[insight.market as keyof typeof marketLabels] || insight.market} 시장</span>
            <span>|</span>
            <span>{timeframeLabels[insight.timeframe]}</span>
            <span>|</span>
            <span
              className="flex items-center gap-1 cursor-help"
              title={formatTimeKST(insight.created_at).absolute}
            >
              <Clock className="h-3 w-3" />
              {formatTimeKST(insight.created_at).relative}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatPrice(insight.current_price, insight.market)}
            </div>
            {insight.price_change_1d !== undefined && (
              <div className={cn(
                "text-sm font-medium",
                insight.price_change_1d >= 0 ? "text-emerald-500" : "text-red-500"
              )}>
                {formatPercentage(insight.price_change_1d)} (1일)
              </div>
            )}
          </div>
          <RecommendationBadge
            recommendation={insight.recommendation}
            confidenceLevel={insight.confidence_level}
            size="lg"
          />
        </div>
      </div>

      {/* Key Summary */}
      {insight.key_summary && insight.key_summary.length > 0 && (
        <SectionCard title="핵심 요약" icon={Lightbulb}>
          <ul className="space-y-2">
            {insight.key_summary.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 투자 의사결정 */}
        <SectionCard title="투자 의사결정" icon={TrendingUp}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <RecommendationBadge
                recommendation={insight.recommendation}
                confidenceLevel={insight.confidence_level}
                size="md"
              />
            </div>
            <TextContent content={insight.recommendation_reason} />
          </div>
        </SectionCard>

        {/* 위험도 평가 */}
        <SectionCard title="위험도 평가" icon={AlertTriangle}>
          <div className="space-y-4">
            <RiskGauge score={insight.risk_score} />
            {insight.risk_analysis && (
              <div className="space-y-2 pt-2">
                <KeyValueItem label="변동성" value={insight.risk_analysis.volatility} />
                <KeyValueItem label="회사 리스크" value={insight.risk_analysis.company_specific} />
                <KeyValueItem label="산업 리스크" value={insight.risk_analysis.industry} />
                <KeyValueItem label="거시경제" value={insight.risk_analysis.macro} />
              </div>
            )}
          </div>
        </SectionCard>

        {/* 시장 현황 */}
        <SectionCard title="시장 현황" icon={BarChart3}>
          <div className="space-y-2">
            <KeyValueItem
              label="현재가"
              value={formatPrice(insight.current_price, insight.market)}
            />
            <KeyValueItem
              label="1일 변동"
              value={formatPercentage(insight.price_change_1d)}
              valueClassName={insight.price_change_1d && insight.price_change_1d >= 0 ? "text-emerald-500" : "text-red-500"}
            />
            <KeyValueItem
              label="1주 변동"
              value={formatPercentage(insight.price_change_1w)}
              valueClassName={insight.price_change_1w && insight.price_change_1w >= 0 ? "text-emerald-500" : "text-red-500"}
            />
            <KeyValueItem
              label="1개월 변동"
              value={formatPercentage(insight.price_change_1m)}
              valueClassName={insight.price_change_1m && insight.price_change_1m >= 0 ? "text-emerald-500" : "text-red-500"}
            />
            {insight.market_overview && (
              <>
                <div className="pt-2 mt-2 border-t border-border/30">
                  <TextContent content={insight.market_overview.price_movement} />
                </div>
              </>
            )}
          </div>
        </SectionCard>

        {/* 시장 심리 */}
        <SectionCard title="시장 심리" icon={Brain}>
          <div className="space-y-4">
            {insight.market_sentiment && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">전반적 심리:</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-sm font-medium",
                  insight.market_sentiment === 'bullish' && "bg-emerald-500/10 text-emerald-500",
                  insight.market_sentiment === 'neutral' && "bg-yellow-500/10 text-yellow-500",
                  insight.market_sentiment === 'bearish' && "bg-red-500/10 text-red-500",
                )}>
                  {sentimentLabels[insight.market_sentiment]}
                </span>
              </div>
            )}
            {insight.sentiment_details && (
              <div className="space-y-2">
                <TextContent content={insight.sentiment_details.overall} />
                <KeyValueItem label="기관 투자자" value={insight.sentiment_details.institutional} />
                <KeyValueItem label="공매도 비율" value={insight.sentiment_details.short_interest} />
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* 딥리서치 분석 */}
      <SectionCard title="딥리서치 분석" icon={FileText}>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <TextContent
            content={insight.deep_research}
            className="text-base leading-7 whitespace-pre-wrap"
          />
        </div>
      </SectionCard>

      {/* 변동 요인 & 미래 촉매 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 현재 변동 요인 */}
        {insight.current_drivers && (
          <SectionCard title="현재 변동 요인" icon={Zap}>
            <div className="space-y-3">
              {insight.current_drivers.news_based && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">뉴스 기반</span>
                  <TextContent content={insight.current_drivers.news_based} />
                </div>
              )}
              {insight.current_drivers.technical && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">기술적 요인</span>
                  <TextContent content={insight.current_drivers.technical} />
                </div>
              )}
              {insight.current_drivers.fundamental && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">펀더멘털</span>
                  <TextContent content={insight.current_drivers.fundamental} />
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* 미래 촉매 */}
        {insight.future_catalysts && (
          <SectionCard title="미래 촉매" icon={Clock}>
            <div className="space-y-3">
              {insight.future_catalysts.short_term && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">단기 (1-3개월)</span>
                  <TextContent content={insight.future_catalysts.short_term} />
                </div>
              )}
              {insight.future_catalysts.mid_term && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">중기 (3-12개월)</span>
                  <TextContent content={insight.future_catalysts.mid_term} />
                </div>
              )}
              {insight.future_catalysts.long_term && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">장기 (1년+)</span>
                  <TextContent content={insight.future_catalysts.long_term} />
                </div>
              )}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Disclaimer */}
      <Disclaimer variant="compact" className="mt-6" />

      {/* Footer Metadata */}
      <div className="flex items-center justify-end text-xs text-muted-foreground pt-4 border-t">
        <span>분석 소요 시간: {insight.processing_time_ms ? `${(insight.processing_time_ms / 1000).toFixed(1)}초` : '-'}</span>
      </div>
    </div>
  );
}
