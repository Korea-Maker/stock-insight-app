/**
 * 주식 분석 상태 관리 스토어
 */
import { create } from 'zustand';
import type { StockInsight, StockInsightSummary, InvestmentTimeframe } from '@/types/stock';

interface AnalysisState {
  // 현재 분석 상태
  isAnalyzing: boolean;
  currentInsight: StockInsight | null;
  error: string | null;

  // 입력 상태
  stockCode: string;
  timeframe: InvestmentTimeframe;

  // 분석 이력
  history: StockInsightSummary[];
  historyTotal: number;

  // 결제 상태
  merchantUid: string | null;
  impUid: string | null;
  isPaying: boolean;
  isCheckingOut: boolean;

  // Actions
  setStockCode: (code: string) => void;
  setTimeframe: (timeframe: InvestmentTimeframe) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setCurrentInsight: (insight: StockInsight | null) => void;
  setError: (error: string | null) => void;
  setHistory: (history: StockInsightSummary[], total: number) => void;
  setMerchantUid: (merchantUid: string | null) => void;
  setImpUid: (impUid: string | null) => void;
  setIsPaying: (isPaying: boolean) => void;
  setIsCheckingOut: (isCheckingOut: boolean) => void;
  reset: () => void;
}

const initialState = {
  isAnalyzing: false,
  currentInsight: null,
  error: null,
  stockCode: '',
  timeframe: 'mid' as InvestmentTimeframe,
  history: [],
  historyTotal: 0,
  merchantUid: null,
  impUid: null,
  isPaying: false,
  isCheckingOut: false,
};

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...initialState,

  setStockCode: (code) => set({ stockCode: code }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setCurrentInsight: (insight) => set({ currentInsight: insight }),
  setError: (error) => set({ error }),
  setHistory: (history, total) => set({ history, historyTotal: total }),
  setMerchantUid: (merchantUid) => set({ merchantUid }),
  setImpUid: (impUid) => set({ impUid }),
  setIsPaying: (isPaying) => set({ isPaying }),
  setIsCheckingOut: (isCheckingOut) => set({ isCheckingOut }),
  reset: () => set(initialState),
}));
