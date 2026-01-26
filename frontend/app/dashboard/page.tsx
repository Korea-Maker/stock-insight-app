"use client";

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCircle, History, Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { AnalysisForm, AnalysisResult, AnalysisHistory } from '@/components/Analysis';
import { useAnalysisStore } from '@/store/useAnalysisStore';

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function DashboardPage() {
  const { currentInsight, error, isAnalyzing } = useAnalysisStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Stock Insight</span>
              </div>
            </div>

            <Link
              href="/history"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">히스토리</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: { staggerChildren: 0.1 }
          }
        }}
        className="py-8 md:py-12"
      >
        <div className="container-narrow space-y-8">
          {/* Page Header */}
          <motion.div variants={fadeIn} className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold">주식 분석</h1>
            <p className="text-muted-foreground">
              종목코드를 입력하고 투자 기간을 선택하세요
            </p>
          </motion.div>

          {/* Analysis Form Card */}
          <motion.div variants={fadeIn} className="card-minimal-bordered">
            <Suspense fallback={
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            }>
              <AnalysisForm />
            </Suspense>
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">오류가 발생했습니다</p>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Analysis Result */}
          {currentInsight && !isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="card-minimal-bordered">
                <AnalysisResult insight={currentInsight} />
              </div>
            </motion.div>
          )}

          {/* Recent History - When no result */}
          {!currentInsight && !isAnalyzing && (
            <motion.div variants={fadeIn}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">최근 분석</h2>
                  <Link
                    href="/history"
                    className="text-sm text-primary hover:underline underline-offset-4"
                  >
                    전체 보기
                  </Link>
                </div>
                <div className="card-minimal-bordered">
                  <AnalysisHistory limit={5} />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.main>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container-narrow">
          <p className="text-sm text-muted-foreground text-center">
            본 서비스는 정보 제공 목적이며, 투자 자문이 아닙니다.
          </p>
        </div>
      </footer>
    </div>
  );
}
