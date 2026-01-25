/**
 * 주식 분석 관련 타입 정의
 */

export type TradingRecommendation = 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type MarketSentiment = 'bullish' | 'neutral' | 'bearish';
export type InvestmentTimeframe = 'short' | 'mid' | 'long';

export interface RiskAnalysis {
  volatility?: string;
  company_specific?: string;
  industry?: string;
  macro?: string;
  liquidity?: string;
  regulatory?: string;
}

export interface MarketOverview {
  current_price?: number;
  price_movement?: string;
  volume_trend?: string;
  support_resistance?: string;
  relative_performance?: string;
}

export interface SentimentDetails {
  overall?: string;
  social_media?: string;
  options_activity?: string;
  insider_trading?: string;
  institutional?: string;
  short_interest?: string;
}

export interface CurrentDrivers {
  news_based?: string;
  technical?: string;
  fundamental?: string;
}

export interface FutureCatalysts {
  short_term?: string;
  mid_term?: string;
  long_term?: string;
}

export interface StockInsight {
  id: number;
  stock_code: string;
  stock_name: string;
  market: string;
  timeframe: InvestmentTimeframe;
  created_at: string;

  // 딥리서치 분석
  deep_research: string;

  // 투자 의사결정
  recommendation: TradingRecommendation;
  confidence_level: ConfidenceLevel;
  recommendation_reason?: string;

  // 위험도 평가
  risk_score: number;
  risk_analysis?: RiskAnalysis;

  // 시장 현황
  current_price?: number;
  price_change_1d?: number;
  price_change_1w?: number;
  price_change_1m?: number;
  market_overview?: MarketOverview;

  // 시장 심리
  market_sentiment?: MarketSentiment;
  sentiment_details?: SentimentDetails;

  // 분석 요약
  key_summary?: string[];
  current_drivers?: CurrentDrivers;

  // 미래 촉매
  future_catalysts?: FutureCatalysts;

  // 메타데이터
  ai_model?: string;
  processing_time_ms?: number;
}

export interface StockInsightSummary {
  id: number;
  stock_code: string;
  stock_name: string;
  market: string;
  timeframe: InvestmentTimeframe;
  recommendation: TradingRecommendation;
  risk_score: number;
  current_price?: number;
  created_at: string;
}

export interface StockInsightListResponse {
  total: number;
  items: StockInsightSummary[];
}

export interface StockAnalysisRequest {
  stock_code: string;
  timeframe: InvestmentTimeframe;
}

export interface AnalysisTriggerResponse {
  message: string;
  insight_id: number;
  stock_code: string;
  stock_name: string;
  recommendation: string;
}

export interface StockSearchResult {
  symbol: string;
  name: string;
  market: string;
}
