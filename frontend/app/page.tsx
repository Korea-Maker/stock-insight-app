"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BrainCircuit,
  TrendingUp,
  Shield,
  Clock,
  ChartBar,
  ArrowRight,
  Zap,
  Globe,
  AlertTriangle,
  Lightbulb,
  Activity,
  FileText,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/Theme/ThemeToggle';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const features = [
  {
    icon: BrainCircuit,
    title: "AI 딥리서치 분석",
    description: "최신 AI 기술을 활용한 심층 분석으로 투자 의사결정에 필요한 인사이트를 제공합니다."
  },
  {
    icon: Clock,
    title: "실시간 분석",
    description: "종목 입력 후 수 초 내에 종합 분석 리포트를 생성합니다."
  },
  {
    icon: ChartBar,
    title: "투자기간별 전략",
    description: "단기, 중기, 장기 투자 목표에 맞는 맞춤형 분석을 제공합니다."
  },
  {
    icon: Shield,
    title: "신뢰도 점수 공개",
    description: "분석의 신뢰도와 위험도를 투명하게 공개하여 신중한 판단을 돕습니다."
  },
  {
    icon: Zap,
    title: "실시간 시장 데이터",
    description: "실시간 주가, 거래량, 기업 정보를 바탕으로 분석합니다."
  },
  {
    icon: Globe,
    title: "한국어 네이티브",
    description: "복잡한 영문 리포트 없이 한국어로 직관적인 분석을 제공합니다."
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-40 animate-pulse-slow" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[40%] bg-secondary/20 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[30%] bg-primary/10 rounded-full blur-[120px] opacity-30" />
      </div>

      {/* Grid Background */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] pointer-events-none z-0" />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center justify-between gap-4 px-4 py-2 rounded-full border border-white/10 bg-background/60 backdrop-blur-2xl shadow-2xl shadow-black/10 ring-1 ring-white/20 dark:ring-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all">
              <BrainCircuit className="h-4 w-4 text-primary" />
            </div>
            <span className="text-base font-bold tracking-tight font-heading">
              Stock Deep Research
            </span>
          </Link>
          <div className="h-5 w-px bg-border/60" />
          <ThemeToggle />
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.section
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 pt-32 pb-20 px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={item} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI 기반 투자 분석 플랫폼</span>
          </motion.div>

          <motion.h1
            variants={item}
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70 font-heading"
          >
            AI로 더 스마트한
            <br />
            투자 의사결정
          </motion.h1>

          <motion.p
            variants={item}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            종목코드만 입력하면 AI가 딥리서치 분석을 수행하여
            투자 추천, 위험도, 시장 심리 등 종합 리포트를 제공합니다.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 text-base px-8 py-6 rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all">
                지금 시작하기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6 rounded-full">
                분석 히스토리 보기
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 py-20 px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
              핵심 기능
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              최신 AI 기술과 실시간 시장 데이터를 결합하여
              개인 투자자를 위한 전문가 수준의 분석을 제공합니다.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full border-border/50 bg-card/50 backdrop-blur-xl hover:bg-card/80 hover:border-primary/30 transition-all duration-300 group">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Sample Analysis Report Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 py-20 px-6 lg:px-8"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-heading">
              분석 리포트 예시
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              실제 AI가 생성하는 분석 결과를 미리 확인해보세요
            </p>
          </div>

          <Card className="p-6 lg:p-8 border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/20 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">NVIDIA Corporation</h3>
                  <span className="px-2 py-0.5 rounded-full bg-muted text-sm font-medium">NVDA</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>미국 시장</span>
                  <span>|</span>
                  <span>중기 (3-12개월)</span>
                  <span>|</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    방금 전
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-2xl font-bold">$142.62</div>
                  <div className="text-sm font-medium text-emerald-500">+3.47% (1일)</div>
                </div>
                <div className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-lg font-bold text-emerald-500">BUY</div>
                  <div className="text-xs text-emerald-500/80">신뢰도: High</div>
                </div>
              </div>
            </div>

            {/* Key Summary */}
            <div className="p-5 rounded-xl border border-border/50 bg-card/30 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold">핵심 요약</h4>
              </div>
              <ul className="space-y-3">
                {[
                  "AI 데이터센터 수요 폭발적 증가로 H100/H200 GPU 공급 부족 지속",
                  "2024 회계연도 데이터센터 매출 YoY +409% 성장 기록",
                  "자동차, 로보틱스 등 신규 성장 동력 확보로 사업 다각화 진행",
                  "높은 밸류에이션이나 실적 성장세가 프리미엄을 정당화",
                  "CUDA 생태계의 강력한 lock-in 효과로 경쟁 우위 지속"
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main Grid - 2x2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 투자 의사결정 */}
              <div className="p-5 rounded-xl border border-border/50 bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">투자 의사결정</h4>
                </div>
                <div className="mb-4">
                  <div className="inline-flex px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <span className="font-bold text-emerald-500">BUY</span>
                    <span className="text-emerald-500/70 ml-2 text-sm">신뢰도: High</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI 인프라 수요 확대로 데이터센터 매출이 급증하고 있으며,
                  Blackwell 아키텍처 출시로 기술적 우위를 더욱 공고히 하고 있습니다.
                  중기 투자 관점에서 AI 산업 성장의 최대 수혜주로 평가됩니다.
                </p>
              </div>

              {/* 위험도 평가 */}
              <div className="p-5 rounded-xl border border-border/50 bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">위험도 평가</h4>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                      <div className="h-full w-[60%] bg-gradient-to-r from-emerald-500 via-yellow-500 to-yellow-500 rounded-full" />
                    </div>
                    <span className="text-lg font-bold">6/10</span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">변동성</span>
                    <span>높음 - 반도체 섹터 특성상 변동성 큼</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">산업 리스크</span>
                    <span>중간 - AI 사이클 둔화 가능성</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">거시경제</span>
                    <span>중간 - 금리 환경 영향</span>
                  </div>
                </div>
              </div>

              {/* 시장 현황 */}
              <div className="p-5 rounded-xl border border-border/50 bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ChartBar className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">시장 현황</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">현재가</span>
                    <span className="font-semibold">$142.62</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">1일 변동</span>
                    <span className="font-semibold text-emerald-500">+3.47%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">1주 변동</span>
                    <span className="font-semibold text-emerald-500">+8.92%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">1개월 변동</span>
                    <span className="font-semibold text-emerald-500">+15.23%</span>
                  </div>
                  <div className="pt-3 mt-3 border-t border-border/30">
                    <p className="text-muted-foreground">
                      강한 상승 모멘텀을 보이며 52주 신고가 근접. 거래량도 평균 대비 증가세.
                    </p>
                  </div>
                </div>
              </div>

              {/* 시장 심리 */}
              <div className="p-5 rounded-xl border border-border/50 bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Brain className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">시장 심리</h4>
                </div>
                <div className="mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">전반적 심리:</span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-500">
                      강세
                    </span>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    AI 인프라 투자 확대에 대한 기대감으로 투자심리가 매우 긍정적입니다.
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">기관 투자자</span>
                    <span>순매수 우위</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">공매도 비율</span>
                    <span>1.2% (낮음)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 딥리서치 분석 */}
            <div className="p-5 rounded-xl border border-border/50 bg-card/30 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <h4 className="font-semibold">딥리서치 분석</h4>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground leading-7">
                  NVIDIA는 AI 반도체 시장의 절대적 선두주자로, 데이터센터 GPU 시장 점유율 90% 이상을 유지하고 있습니다.
                  최근 발표된 Blackwell 아키텍처는 H100 대비 최대 30배 향상된 AI 추론 성능을 제공하며,
                  Microsoft, Google, Amazon 등 주요 클라우드 사업자들의 선주문이 이미 완료된 상태입니다.
                </p>
                <p className="text-muted-foreground leading-7 mt-4">
                  CUDA 생태계의 강력한 lock-in 효과로 경쟁사 대비 지속적인 경쟁 우위를 확보하고 있으며,
                  자동차(자율주행), 로보틱스, 헬스케어 등 신규 성장 동력도 확보하고 있습니다.
                  다만, 높은 밸류에이션(Forward P/E 35x)과 반도체 사이클 리스크는 주의가 필요합니다.
                </p>
              </div>
            </div>

            {/* 변동 요인 & 미래 촉매 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* 현재 변동 요인 */}
              <div className="p-5 rounded-xl border border-border/50 bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">현재 변동 요인</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">뉴스 기반</span>
                    <p className="text-sm mt-1">Blackwell 칩 양산 본격화 소식과 주요 테크 기업들의 AI 인프라 투자 확대 발표</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">기술적 요인</span>
                    <p className="text-sm mt-1">50일 이동평균선 돌파, RSI 65로 과매수 진입 직전 구간</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">펀더멘털</span>
                    <p className="text-sm mt-1">데이터센터 매출 분기별 신기록 갱신, 마진율 개선 지속</p>
                  </div>
                </div>
              </div>

              {/* 미래 촉매 */}
              <div className="p-5 rounded-xl border border-border/50 bg-card/30">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <h4 className="font-semibold">미래 촉매</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">단기 (1-3개월)</span>
                    <p className="text-sm mt-1">차기 분기 실적 발표, GTC 2025 컨퍼런스 신제품 발표</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">중기 (3-12개월)</span>
                    <p className="text-sm mt-1">Blackwell 양산 확대, 자동차/로보틱스 사업 성장, 중국 시장 회복</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">장기 (1년+)</span>
                    <p className="text-sm mt-1">AGI 개발 가속화에 따른 컴퓨팅 수요 폭발, 소프트웨어 사업 확대</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center pt-6 border-t border-border/30">
              <p className="text-sm text-muted-foreground mb-4">
                이와 같은 상세한 분석을 원하는 종목에 대해 받아보세요
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 rounded-full">
                  내 종목 분석하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </motion.section>

      {/* Disclaimer Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="relative z-10 py-16 px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-amber-500 mb-2">투자 유의사항</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  본 서비스는 AI 기반 정보 제공 서비스이며, <strong>투자 자문 또는 권유가 아닙니다</strong>.
                  제공되는 분석 결과는 참고 자료로만 활용하시고,
                  투자 결정에 따른 책임은 전적으로 투자자 본인에게 있습니다.
                  주식 투자는 원금 손실의 위험이 있으며,
                  과거의 수익률이 미래의 수익을 보장하지 않습니다.
                  투자 전 반드시 전문가와 상담하시기 바랍니다.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            <span>Stock Deep Research</span>
          </div>
          <p>AI 기반 주식 분석 플랫폼 - 정보 제공 목적 전용</p>
        </div>
      </footer>
    </div>
  );
}
