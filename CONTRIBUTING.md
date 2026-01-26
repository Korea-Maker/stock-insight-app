# Contributing to Stock Insight App

Stock Insight App에 기여해 주셔서 감사합니다.

## 시작하기

1. **저장소 Fork**
2. **로컬에 클론**:
   ```bash
   git clone https://github.com/your-username/stock-insight-app.git
   cd stock-insight-app
   ```
3. **개발 환경 설정**: [DEVELOPMENT.md](./docs/guides/DEVELOPMENT.md) 참조

## 기여 방법

### 버그 리포트

GitHub Issues에서 다음 정보와 함께 리포트:

- 재현 단계
- 예상 동작 vs 실제 동작
- 환경 정보 (OS, Python/Node 버전)
- 에러 메시지/로그

### 기능 제안

Issues에서 다음 내용과 함께 제안:

- 해결하려는 문제
- 제안하는 해결책
- 대안 고려 여부

### Pull Request

1. **feature 브랜치 생성**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **코드 작성 및 커밋**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

3. **Push 및 PR 생성**:
   ```bash
   git push origin feature/your-feature-name
   ```

## 코딩 표준

### Python

- PEP 8 준수
- Type hints 필수
- Pydantic 모델 사용
- async/await 패턴

### TypeScript

- strict 모드
- 함수형 컴포넌트
- 서버 컴포넌트 우선
- Zustand 상태 관리

## 커밋 메시지

```
<type>: <description>

Types:
- feat: 새 기능
- fix: 버그 수정
- refactor: 리팩토링
- docs: 문서
- test: 테스트
- chore: 빌드/설정
```

## 개발 규칙

- Mock 데이터 사용 금지 (실제 API 사용)
- `use client` 최소화
- 테스트 작성 권장
- 문서 업데이트

## 라이선스

이 프로젝트에 기여하면 MIT 라이선스에 동의하는 것으로 간주됩니다.
