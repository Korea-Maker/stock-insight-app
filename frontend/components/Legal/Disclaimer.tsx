"use client";

import { AlertTriangle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DisclaimerProps {
  variant?: 'full' | 'compact';
  className?: string;
}

export function Disclaimer({ variant = 'full', className }: DisclaimerProps) {
  if (variant === 'compact') {
    return (
      <div className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs text-muted-foreground",
        className
      )}>
        <Info className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
        <span>
          본 분석은 투자 자문이 아니며, 참고 자료로만 활용하시기 바랍니다. 투자 책임은 본인에게 있습니다.
        </span>
      </div>
    );
  }

  return (
    <Card className={cn(
      "p-5 border-amber-500/30 bg-amber-500/5 backdrop-blur-sm",
      className
    )}>
      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-amber-500 text-sm">투자 유의사항</h4>
          <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
            <p>
              <strong className="text-foreground/80">본 서비스는 AI 기반 정보 제공 서비스이며, 투자 자문 또는 권유가 아닙니다.</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>제공되는 분석 결과는 참고 자료로만 활용하시기 바랍니다.</li>
              <li>투자 결정에 따른 책임은 전적으로 투자자 본인에게 있습니다.</li>
              <li>주식 투자는 원금 손실의 위험이 있습니다.</li>
              <li>과거의 수익률이 미래의 수익을 보장하지 않습니다.</li>
              <li>투자 전 반드시 전문가와 상담하시기 바랍니다.</li>
            </ul>
            <p className="pt-1 text-muted-foreground/80">
              본 서비스는 금융투자업자가 아니며, 「자본시장과 금융투자업에 관한 법률」에 따른 투자자문업 또는 투자일임업을 영위하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
