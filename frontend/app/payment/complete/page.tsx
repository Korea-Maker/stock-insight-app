"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { verifyPayment } from '@/lib/api/payment';
import { analyzeStock, getAnalysisById } from '@/lib/api/analysis';
import { useAnalysisStore } from '@/store/useAnalysisStore';

function LoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        <p className="text-lg font-medium">로딩 중...</p>
      </div>
    </div>
  );
}

function PaymentCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setCurrentInsight, setError } = useAnalysisStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('결제 확인 중...');

  useEffect(() => {
    const impUid = searchParams.get('imp_uid');
    const merchantUid = searchParams.get('merchant_uid');
    const impSuccess = searchParams.get('imp_success');

    if (!impUid || !merchantUid) {
      setStatus('error');
      setMessage('결제 정보가 올바르지 않습니다.');
      setTimeout(() => router.replace('/dashboard'), 3000);
      return;
    }

    if (impSuccess === 'false') {
      const errorMsg = searchParams.get('error_msg');
      setStatus('error');
      setMessage(errorMsg || '결제가 취소되었습니다.');
      setTimeout(() => router.replace('/dashboard'), 3000);
      return;
    }

    // 서버 검증 및 분석 실행
    (async () => {
      try {
        setMessage('결제 검증 중...');
        const verifyResult = await verifyPayment(impUid, merchantUid);

        if (!verifyResult.verified) {
          throw new Error('결제 검증에 실패했습니다.');
        }

        setMessage('분석을 시작합니다...');

        // URL에서 stock_code와 timeframe 파싱 (merchant_uid에서)
        // merchant_uid 형식: analysis_{uuid}
        // 실제 stock/timeframe은 서버 payment_expectation에 저장되어 있음
        const analysisResult = await analyzeStock('', 'mid', merchantUid);
        const insight = await getAnalysisById(analysisResult.insight_id);
        setCurrentInsight(insight);

        setStatus('success');
        setMessage('분석이 완료되었습니다!');
        setTimeout(() => router.replace('/dashboard'), 2000);

      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
        setError(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
        setTimeout(() => router.replace('/dashboard'), 3000);
      }
    })();
  }, [searchParams, router, setCurrentInsight, setError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="text-center space-y-4">
        {status === 'loading' && (
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        )}
        {status === 'success' && (
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
        )}
        {status === 'error' && (
          <XCircle className="h-16 w-16 text-red-500 mx-auto" />
        )}
        <p className="text-lg font-medium">{message}</p>
        {status !== 'loading' && (
          <p className="text-sm text-muted-foreground">
            잠시 후 대시보드로 이동합니다...
          </p>
        )}
      </div>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentCompleteContent />
    </Suspense>
  );
}
