"use client";

import { motion } from 'framer-motion';
import { AlertCircle, BrainCircuit, History } from 'lucide-react';
import { AnalysisForm, AnalysisResult, AnalysisHistory } from '@/components/Analysis';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { Card } from '@/components/ui/card';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { currentInsight, error, isAnalyzing } = useAnalysisStore();

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-8">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="px-6 lg:px-8 space-y-8 max-w-6xl mx-auto w-full"
      >
        {/* Header */}
        <motion.header variants={item} className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 mb-4">
            <BrainCircuit className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 font-heading">
            AI 주식 딥리서치
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            한국 및 미국 주식에 대한 AI 기반 딥리서치 분석을 제공합니다.
            종목을 입력하고 투자 기간을 선택하세요.
          </p>
        </motion.header>

        {/* Analysis Form */}
        <motion.div variants={item}>
          <Card className="p-6 lg:p-8 border-primary/20 bg-card/50 backdrop-blur-xl">
            <AnalysisForm />
          </Card>
        </motion.div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Analysis Result */}
        {currentInsight && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 lg:p-8 border-border/50 bg-card/50 backdrop-blur-xl">
              <AnalysisResult insight={currentInsight} />
            </Card>
          </motion.div>
        )}

        {/* Recent History */}
        {!currentInsight && !isAnalyzing && (
          <motion.div variants={item} className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">최근 분석 기록</h2>
            </div>
            <AnalysisHistory limit={5} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
