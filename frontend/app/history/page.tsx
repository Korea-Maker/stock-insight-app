"use client";

import { motion } from 'framer-motion';
import { History, TrendingUp } from 'lucide-react';
import { AnalysisHistory } from '@/components/Analysis';
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

export default function HistoryPage() {
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
            <History className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 font-heading">
            분석 히스토리
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            이전에 수행한 모든 AI 주식 분석 결과를 확인하세요.
            각 분석을 클릭하면 상세 보고서를 볼 수 있습니다.
          </p>
        </motion.header>

        {/* History List */}
        <motion.div variants={item}>
          <Card className="p-6 lg:p-8 border-border/50 bg-card/50 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">전체 분석 기록</h2>
            </div>
            <AnalysisHistory limit={50} />
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
