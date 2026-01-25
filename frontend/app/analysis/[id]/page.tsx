"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnalysisResult } from '@/components/Analysis';
import { getAnalysisById } from '@/lib/api/analysis';
import type { StockInsight } from '@/types/stock';

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [insight, setInsight] = useState<StockInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInsight = async () => {
      const id = params.id;
      if (!id || typeof id !== 'string') {
        setError('유효하지 않은 분석 ID입니다.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await getAnalysisById(parseInt(id, 10));
        setInsight(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '분석 결과를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsight();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen pt-24 pb-8">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">분석 결과를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen pt-24 pb-8">
        <div className="px-6 lg:px-8 max-w-6xl mx-auto w-full">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로 가기
          </Button>
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">오류 발생</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Button onClick={() => router.push('/dashboard')}>
                대시보드로 이동
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="flex flex-col min-h-screen pt-24 pb-8">
        <div className="px-6 lg:px-8 max-w-6xl mx-auto w-full">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            뒤로 가기
          </Button>
          <Card className="p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">분석 결과 없음</h2>
              <p className="text-muted-foreground mb-6">
                요청하신 분석 결과를 찾을 수 없습니다.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                새 분석 시작하기
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pt-24 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 lg:px-8 space-y-6 max-w-6xl mx-auto w-full"
      >
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-2"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          뒤로 가기
        </Button>

        {/* Analysis Result */}
        <Card className="p-6 lg:p-8 border-border/50 bg-card/50 backdrop-blur-xl">
          <AnalysisResult insight={insight} />
        </Card>
      </motion.div>
    </div>
  );
}
