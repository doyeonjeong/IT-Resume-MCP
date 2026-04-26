# Resume-MCP — 현황 분석 및 보완 계획

> 작성일: 2026-03-30
> 목표: 실사용 가능 수준으로 완성 → 포트폴리오 + STEP AI 지원용

---

## 프로젝트 개요

Cursor AI와 통합되어 채용 공고(JD) 맞춤형 이력서·포트폴리오·자기소개서를 자동 생성하는 MCP 서버.
Claude / OpenAI / Gemini 3개 LLM Fallback 지원. 4개 MCP Tool 구현.

---

## 현재 상태 진단

### 확인된 구조
```
public-resume-mcp/
├── src/        # NestJS 소스 (llm, profile, resume 모듈 추정)
├── data/       # 프로필 데이터
├── documents/  # 기획 문서
├── dist/       # 빌드 결과물 (빌드됨)
├── test/       # 테스트
└── .env        # 환경 변수 설정됨
```

### 긍정적 신호
- dist/ 존재 → 빌드가 완료된 상태
- .env 파일 존재 → 실제로 사용 가능한 상태
- documents/ 존재 → 기획 문서화 됨

### 사용자 평가 (기억 기반)
> "대충 만들었어서 보완이 필요할 것 같고"

→ 기본 동작은 하지만 프롬프트 품질, 에러 처리, 사용성이 부족할 가능성.

---

## 보완 필요 항목

### 🔴 실사용을 위한 필수 보완

| 항목 | 현재 예상 문제 | 개선 방향 |
|------|-------------|---------|
| 이력서 생성 프롬프트 품질 | 너무 일반적인 결과 | System Prompt에 이력서 작성 전문 지침 추가, Few-shot 예시 포함 |
| 에러 핸들링 | API 크레딧 초과 시 명확한 에러 미제공 가능성 | try/catch + 유의미한 에러 메시지 |
| 프로필 데이터 스키마 | data/ 포맷 불명확 | README에 스키마 문서화 |
| Cursor 연동 설명 | 사용자가 직접 설정해야 함 | README에 단계별 설치 가이드 |

### 🟡 품질 개선 (권장)

| 항목 | 이유 |
|------|------|
| 생성된 이력서 실제 테스트 | "JD + 프로필 → 좋은 이력서" 나오는지 직접 검증 필요 |
| generate_portfolio 품질 | 이력서와 다른 포맷인지 확인 |
| generate_cover_letter 품질 | 자기소개서 특유의 스토리텔링 포함 여부 |
| 토큰 최적화 | 긴 JD 입력 시 컨텍스트 초과 대비 |

### 🟢 차별화 포인트 (선택)

| 항목 | 포트폴리오 가치 |
|------|--------------|
| 한국어 최적화 프롬프트 | 한국 취업 이력서 특화 (STEP AI 포함) |
| JD 분석 Tool 추가 | JD에서 핵심 키워드 자동 추출 |
| 여러 이력서 버전 비교 | A/B 비교 기능 |

---

## 즉시 확인 필요 사항

에이전트는 작업 시작 전 다음을 실행할 것:

```bash
# 1. 빌드 상태 확인
cd ~/Repositories/Public-IT-Developer-Resume-Local-MCP/public-resume-mcp
cat package.json | grep '"main"'

# 2. 실제 동작 테스트
node dist/main.js
# → stdio 대기 상태면 정상

# 3. 프롬프트 파일 위치 확인
find src/ -name "*.prompt.*" -o -name "*template*" | head -20

# 4. 테스트 실행
npm run test
```

---

## README 최소 요구사항 (포트폴리오용)

- [ ] 프로젝트 설명 (1-2문장)
- [ ] 설치 방법 (`npm install` + `.env` 설정)
- [ ] Cursor AI 연동 방법 (mcp.json 예시 포함)
- [ ] 사용 예시 (Cursor에서 실제 사용 스크린샷 or GIF)
- [ ] 지원 LLM Provider 목록

---

## 포트폴리오 기재 전제 조건

- [ ] **실제로 좋은 이력서가 생성되는지 본인이 직접 확인**
- [ ] Cursor AI와 연동하여 동작 확인
- [ ] README에 사용 예시 스크린샷 포함
- [ ] 생성 품질이 "쓸만한 수준" 이상인지 판단 후 기재
