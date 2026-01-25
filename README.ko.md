# Stock Insight App

> AI 기반 주식 딥리서치 분석 애플리케이션

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688)](https://fastapi.tiangolo.com/)

**[English](./README.md)** | **한국어**

---

## 개요

Stock Insight App은 AI를 활용한 주식 딥리서치 분석 애플리케이션입니다. 종목코드 또는 회사명을 입력하고 투자 기간을 선택하면 AI가 종합적인 투자 분석 보고서를 생성합니다.

### 주요 기능

- **종목 검색**: 자동완성 기능으로 빠른 종목 검색
- **투자 기간 선택**: 단기(1-3개월), 중기(3-12개월), 장기(1년+)
- **AI 딥리서치**: GPT-4 기반 종합 투자 분석
- **투자 추천**: 적극매입/매입/홀드/매도/적극매도
- **위험도 분석**: 1-10점 스케일 위험도 평가
- **시장 심리**: 강세/중립/약세 판단
- **분석 히스토리**: 이전 분석 결과 저장 및 조회

---

## 빠른 시작

### 필수 요구사항

- Node.js 18+
- Python 3.11+
- Finnhub API 키 (무료: https://finnhub.io/)
- OpenAI API 키

### 1. 저장소 복제

```bash
git clone https://github.com/Korea-Maker/stock-insight-app.git
cd stock-insight-app
```

### 2. 백엔드 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp env.example .env
# .env 파일에 API 키 입력

# 서버 실행
python main.py
```

### 3. 프론트엔드 설정

```bash
cd frontend
npm install
npm run dev
```

- 백엔드: http://localhost:8000
- 프론트엔드: http://localhost:3000

---

## API 사용법

### 주식 분석 실행

```bash
curl -X POST http://localhost:8000/api/analysis/stock \
  -H "Content-Type: application/json" \
  -d '{"stock_code": "AAPL", "timeframe": "mid"}'
```

### 분석 결과 조회

```bash
curl http://localhost:8000/api/analysis/1
```

### 히스토리 조회

```bash
curl http://localhost:8000/api/analysis/history?limit=10
```

---

## 분석 결과 항목

| 항목 | 설명 |
|------|------|
| 딥리서치 분석 | 종합적인 기업 및 시장 분석 |
| 투자 의사결정 | strong_buy / buy / hold / sell / strong_sell |
| 신뢰도 | high / medium / low |
| 위험도 점수 | 1-10 (높을수록 위험) |
| 시장 심리 | bullish / neutral / bearish |
| 핵심 요약 | 주요 포인트 3-5개 |
| 변동 요인 | 뉴스, 기술적, 펀더멘털 |
| 미래 촉매 | 단기, 중기, 장기 |

---

## 지원 시장

| 시장 | 지원 | 예시 |
|------|------|------|
| 미국 (US) | O | AAPL, GOOGL, MSFT, TSLA |
| 한국 (KR) | X | Finnhub 무료 티어 미지원 |

---

## 기술 스택

### 프론트엔드
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zustand

### 백엔드
- FastAPI
- SQLAlchemy (SQLite)
- OpenAI API
- Finnhub API

---

## 환경 변수

```bash
# backend/.env
OPENAI_API_KEY=sk-...
FINNHUB_API=your_key
ANTHROPIC_API_KEY=sk-ant-...  # 선택사항
LLM_PRIMARY_PROVIDER=openai
```

---

## 라이선스

MIT License

---

## 기여

1. 저장소 포크
2. 기능 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성
