"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  TrendingUp,
  BarChart3,
  Brain,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="container-wide">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">Stock Insight</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                분석
              </Link>
              <Link href="/history" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                히스토리
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <Button className="rounded-lg">
                  시작하기
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="pt-32 pb-20 md:pt-40 md:pb-32"
      >
        <div className="container-narrow text-center">
          <motion.div variants={fadeIn} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI 기반 주식 분석
            </span>
          </motion.div>

          <motion.h1 variants={fadeIn} className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight mb-6">
            더 나은 투자 결정을
            <br />
            <span className="text-primary">더 빠르게</span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            종목코드만 입력하면 AI가 실시간 데이터를 분석하여
            투자 인사이트를 제공합니다.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-lg px-8 h-12 text-base">
                무료로 시작하기
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/history">
              <Button variant="outline" size="lg" className="rounded-lg px-8 h-12 text-base">
                분석 예시 보기
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Grid */}
      <section className="py-20 bg-secondary/30">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">간단하고 강력한 분석</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              복잡한 데이터를 AI가 정리하여 핵심만 전달합니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "AI 딥리서치",
                description: "GPT-4 기반의 심층 분석으로 전문가 수준의 인사이트를 제공합니다"
              },
              {
                icon: Clock,
                title: "실시간 데이터",
                description: "Finnhub API를 통해 최신 시장 데이터를 실시간으로 반영합니다"
              },
              {
                icon: BarChart3,
                title: "투자기간별 전략",
                description: "단기, 중기, 장기 투자 목표에 맞는 맞춤 분석을 제공합니다"
              },
              {
                icon: TrendingUp,
                title: "명확한 추천",
                description: "Buy, Hold, Sell 등 명확한 투자 의사결정 가이드를 제시합니다"
              },
              {
                icon: Shield,
                title: "위험도 평가",
                description: "변동성, 산업, 거시경제 등 다각도 리스크 분석을 제공합니다"
              },
              {
                icon: Sparkles,
                title: "신뢰도 공개",
                description: "분석의 한계와 신뢰 수준을 투명하게 공개합니다"
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card-minimal-bordered hover-lift"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20">
        <div className="container-narrow">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold mb-4">간단한 3단계</h2>
            <p className="text-muted-foreground">
              복잡한 과정 없이 바로 분석을 시작하세요
            </p>
          </div>

          <div className="space-y-12">
            {[
              { step: "01", title: "종목 입력", description: "분석하고 싶은 종목코드나 회사명을 입력하세요" },
              { step: "02", title: "투자기간 선택", description: "단기, 중기, 장기 중 투자 목표에 맞는 기간을 선택하세요" },
              { step: "03", title: "분석 확인", description: "AI가 생성한 종합 분석 리포트를 확인하세요" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-6"
              >
                <span className="text-5xl font-bold text-primary/20">{item.step}</span>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-narrow text-center">
          <h2 className="text-3xl font-semibold mb-4">지금 바로 시작하세요</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            AI 기반 주식 분석으로 더 현명한 투자 결정을 내리세요
          </p>
          <Link href="/dashboard">
            <Button size="lg" variant="secondary" className="rounded-lg px-8 h-12 text-base">
              분석 시작하기
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container-wide">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-medium">Stock Insight</span>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              본 서비스는 정보 제공 목적이며, 투자 자문이 아닙니다.
            </p>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/dashboard" className="hover:text-foreground transition-colors">분석</Link>
              <Link href="/history" className="hover:text-foreground transition-colors">히스토리</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
