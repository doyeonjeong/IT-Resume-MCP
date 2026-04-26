# DEV-PLAN: Resume MCP Server — Local LLM (Gemma 4 26B) Integration

> **Mission:** JD 입력 → JD 분석 → 프로필 매칭 → bullet 생성 → ATS 친화 이력서 Markdown 출력을 **로컬 Ollama (gemma4:26b)** 로 처리하는 MCP 서버
> **Stack:** NestJS 11, TypeScript, MCP SDK, Ollama API, Markdown
> **Target:** Phase 3 완료 후 `pnpm dev` → MCP tool 호출 → 로컬 LLM으로 JD 분석 + 이력서 생성 가능
> **Environment:** MacBook Pro M5 Pro 24GB, Ollama, gemma4:26b

---

## Agent Instructions

### 항상 지켜야 할 규칙
1. **profile.json이 데이터 소스** — 이력서/자기소개서 생성 시 반드시 이 파일에서 프로필 읽기
2. **한 번에 하나의 체크리스트 항목만** 완료 후 검증
3. **MCP Tool 기존 5개 스펙 변경 금지** — `get_profile`, `update_profile`, `generate_resume`, `generate_portfolio`, `generate_cover_letter`는 이미 Cursor와 연동됨
4. **Ollama adapter는 기존 LLM Fallback과 독립** — `LocalLLMClient` 인터페이스로 감싸고, 기존 Cloud LLM fallback 로직은 건드리지 않음
5. **프롬프트는 TypeScript 상수로 파일 분리** — `src/llm/prompts/*.prompt.ts`
6. **작업 완료 후 Session Log 업데이트**
7. **.env에 OLLAMA_BASE_URL, OLLAMA_MODEL, LLM_TIMEOUT_MS 추가**

### Behavior Rules (AI 이력서 생성 규칙)
1. 없는 경력 만들지 않기
2. 수치 성과를 임의로 만들지 않기
3. JD 키워드를 억지로 반복하지 않기
4. junior 개발자에게 맞는 표현 사용
5. "리딩했다"보다 "구현했다 / 개선했다 / 설계에 참여했다" 우선
6. 불확실한 부분은 `needs_user_input`으로 분리
7. 결과물은 Markdown 기반으로 관리
8. 로컬 LLM 실패 시 에러 메시지를 명확히 반환

### 이 프로젝트 특이사항
- **작업 디렉토리**: `public-resume-mcp/` (루트가 아님)
- **MCP 서버 실행**: `npm run mcp` (`tsx src/mcp-server.ts`)
- **dist/ 폴더**: 빌드 결과물이 이미 있음. 변경 후 반드시 `npm run build` 재실행
- **profile.json**: `data/profile.json` — 개인 정보 포함, 절대 커밋하지 말 것
- **documents/ 폴더**: 생성된 이력서/자기소개서 저장됨, `.gitignore`에 포함

---

## Tech Stack & Conventions

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Framework | NestJS | 11+ |
| Language | TypeScript | strict |
| Protocol | Model Context Protocol SDK | 1.24+ |
| Local LLM | Ollama API (gemma4:26b) | latest |
| AI Fallback (Cloud) | Claude/GPT/Gemini | 기존 유지 |
| Validation | class-validator, Zod | latest |
| Build | npm/pnpm (tsc) | - |

### 디렉토리 구조 (Phase 3 완성 후)

```
public-resume-mcp/
├── src/
│   ├── main.ts                         # HTTP 서버 (선택)
│   ├── mcp-server.ts                   # MCP 서버 엔트리 (기존 5 + 신규 4 tool)
│   ├── app.module.ts                   # NestJS root module
│   ├── config/
│   │   └── llm.config.ts              # 환경변수 설정 (OLLAMA 추가)
│   ├── llm/
│   │   ├── llm.module.ts
│   │   ├── llm.service.ts             # 기존 Cloud LLM Fallback (변경 최소화)
│   │   ├── local-llm.client.ts        # [신규] LocalLLMClient 인터페이스
│   │   ├── ollama.client.ts           # [신규] Ollama HTTP adapter
│   │   └── prompts/                   # [신규] 프롬프트 파일 분리
│   │       ├── analyze-jd.prompt.ts
│   │       ├── match-profile.prompt.ts
│   │       ├── generate-bullets.prompt.ts
│   │       └── generate-resume.prompt.ts
│   ├── domain/                         # [신규] 타입 정의
│   │   ├── jd-analysis.ts
│   │   └── resume.ts
│   ├── profile/
│   │   ├── profile.module.ts
│   │   ├── profile.service.ts
│   │   └── dto/
│   ├── resume/
│   │   ├── resume.module.ts
│   │   ├── resume.service.ts          # 기존 생성 로직 유지
│   │   ├── resume.controller.ts
│   │   └── dto/
│   └── utils/
│       ├── json-parser.ts             # [신규] LLM JSON 응답 파싱 유틸
│       └── validation.ts             # [신규] 응답 검증
├── data/
│   ├── profile.json                   # 실제 프로필 (gitignore)
│   └── profile.example.json           # [신규] 예시 프로필
├── .env                               # OLLAMA_* 환경변수 추가
├── .env.example                       # 템플릿 업데이트
└── package.json
```

### 네이밍 규칙
- NestJS 모듈: `[Name]Module`, 서비스: `[Name]Service`
- Local LLM: `LocalLLMClient` 인터페이스, `OllamaClient` 구현체
- 프롬프트 상수: `ANALYZE_JD_SYSTEM_PROMPT`, `MATCH_PROFILE_SYSTEM_PROMPT` 등
- 에러: 구체적 메시지 (`OLLAMA_CONNECTION_FAILED`, `LLM_JSON_PARSE_ERROR`)

### Anti-patterns
- 기존 MCP Tool 5개 이름/파라미터 변경 (Cursor 연동 깨짐)
- `profile.json` 커밋
- `any` 타입
- Ollama adapter에 Cloud API 로직 혼합
- 프롬프트 하드코딩 (반드시 `prompts/` 폴더 분리)

---

## Completed Phases

### Phase 1 — 기본 구현 (완료)
- [x] NestJS 모듈 구조 (llm, profile, resume)
- [x] 다중 LLM Cloud Fallback 로직 (Claude → GPT → Gemini)
- [x] MCP Tool 5개 구현
- [x] `npm run build` → `dist/` 생성
- [x] Cursor 연동 설정 가이드

### Phase 2 — MCP-NestJS 단절 수정 + 프롬프트 품질 (2026-04-17 완료)
- [x] 환경변수 개별 키 읽기
- [x] 실제 Fallback 구현 + 모델명 최신화
- [x] 전문 시스템 프롬프트 (STAR, JD 매핑, no-placeholder)
- [x] TDD 27개 테스트 통과
- [x] README 최신화

---

## Phase 3 — Local LLM (Ollama/Gemma4) + 신규 MCP Tools

### 사전 확인 (수동)
```bash
ollama list                    # gemma4:26b 설치 확인
ollama run gemma4:26b          # 모델 동작 확인
```

### Step 3.1 — Ollama Local LLM Adapter
> Ollama HTTP API를 감싸는 adapter 구현

- [ ] `src/llm/local-llm.client.ts` — `LocalLLMClient` 인터페이스 정의
  ```ts
  export interface LocalLLMClient {
    chat(input: LocalChatInput): Promise<LocalChatOutput>;
  }
  export interface LocalChatInput {
    system?: string;
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    temperature?: number;
    maxTokens?: number;
  }
  export interface LocalChatOutput {
    content: string;
    raw?: unknown;
  }
  ```
- [ ] `src/llm/ollama.client.ts` — Ollama HTTP adapter 구현
  - endpoint: `http://localhost:11434/api/chat`
  - 환경변수: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `LLM_TIMEOUT_MS`
  - JSON 응답 파싱 실패 시 복구 로직 (regex fallback)
  - timeout 설정 (기본 120초)
  - streaming 미지원 (일단 제외)
  - 연결 실패 시 명확한 에러: `OLLAMA_CONNECTION_FAILED: Ollama 서버가 실행 중인지 확인하세요`
- [ ] `src/config/llm.config.ts` — OLLAMA_* 환경변수 등록
- [ ] `.env.example` 업데이트
  ```env
  OLLAMA_BASE_URL=http://localhost:11434
  OLLAMA_MODEL=gemma4:26b
  LLM_TIMEOUT_MS=120000
  ```
- [ ] `OllamaClient` 유닛 테스트 (mock HTTP)

**검증:** `OllamaClient.chat()` 호출 → mock 응답 정상 반환

---

### Step 3.2 — 프롬프트 파일 분리
> 인라인 프롬프트를 `src/llm/prompts/`로 분리

- [ ] `src/llm/prompts/analyze-jd.prompt.ts` — JD 분석 시스템 프롬프트
  ```ts
  export const ANALYZE_JD_SYSTEM_PROMPT = `
  You are a senior technical recruiter and resume optimization assistant.
  Your task is to analyze a job description and extract structured hiring signals.
  Rules:
  - Return JSON only.
  - Do not invent requirements.
  - Separate required skills from preferred skills.
  - Identify ATS keywords.
  - Identify potential risk factors for a junior candidate.
  `;
  ```
- [ ] `src/llm/prompts/match-profile.prompt.ts` — 프로필 매칭 프롬프트
- [ ] `src/llm/prompts/generate-bullets.prompt.ts` — bullet 생성 프롬프트 (과장금지, junior톤, ATS 키워드)
- [ ] `src/llm/prompts/generate-resume.prompt.ts` — 기존 이력서 프롬프트 마이그레이션
- [ ] 기존 `resume.service.ts`의 인라인 프롬프트 → import로 교체

**검증:** 기존 테스트 27개 그대로 통과

---

### Step 3.3 — Domain 타입 정의
> JD 분석/매칭/이력서 구조의 TypeScript 타입

- [ ] `src/domain/jd-analysis.ts`
  ```ts
  export interface JdAnalysis {
    roleTitle: string;
    companyType: string;
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    keywords: string[];
    seniority: 'junior' | 'mid' | 'senior' | 'unknown';
    atsKeywords: string[];
    riskFactors: string[];
  }
  ```
- [ ] `src/domain/resume.ts` — `ProfileMatch`, `ResumeBullets`, `ResumeMarkdown` 타입
- [ ] `src/domain/profile.ts` — 기존 Profile 타입을 여기로 이동 (선택)

**검증:** `tsc --noEmit` 통과

---

### Step 3.4 — JSON 파싱 유틸
> LLM이 JSON을 markdown 코드블록으로 감쌀 때 대응

- [ ] `src/utils/json-parser.ts`
  - `parseJsonFromLLM(text: string): unknown` — ` ```json ... ``` ` 패턴 제거 후 파싱
  - 파싱 실패 시 regex로 `{...}` 추출 시도
  - 최종 실패 시 `LLM_JSON_PARSE_ERROR` throw
- [ ] 유닛 테스트 (정상 JSON / 코드블록 감싼 JSON / 깨진 JSON)

**검증:** 테스트 통과

---

### Step 3.5 — MCP Tool: `analyze_jd`
> JD 텍스트 → 구조화된 `JdAnalysis` JSON

- [ ] `src/mcp/tools/analyze-jd.tool.ts` 또는 `mcp-server.ts`에 직접 추가
  - 입력: `{ jdText: string }`
  - 출력: `JdAnalysis` JSON
  - Ollama `gemma4:26b`로 호출
  - 프롬프트: `ANALYZE_JD_SYSTEM_PROMPT` 사용
  - JSON 파싱: `parseJsonFromLLM()` 사용
- [ ] `mcp-server.ts`에 tool 등록 (ListTools + CallTool)
- [ ] 통합 테스트 (mock Ollama)

**검증:** MCP tool 호출 → JdAnalysis 구조의 JSON 반환

---

### Step 3.6 — MCP Tool: `match_profile_to_jd`
> 프로필 vs JD 분석 결과 비교 → 강조 포인트 도출

- [ ] 구현
  - 입력: `{ jdAnalysis: JdAnalysis, profile?: object }` (profile 생략 시 `data/profile.json` 사용)
  - 출력:
    ```json
    {
      "strongMatches": [],
      "partialMatches": [],
      "missingButRecoverable": [],
      "doNotOverclaim": [],
      "recommendedPositioning": "string"
    }
    ```
  - Ollama로 호출 + JSON 파싱
- [ ] `mcp-server.ts`에 tool 등록
- [ ] 테스트

**검증:** analyze_jd 결과를 입력 → 매칭 결과 JSON 반환

---

### Step 3.7 — MCP Tool: `generate_resume_bullets`
> JD 맞춤 이력서 bullet 생성

- [ ] 구현
  - 입력: `{ jdAnalysis: JdAnalysis, profile?: object, language: 'ko' | 'en', tone: 'concise' | 'professional' | 'startup' }`
  - 출력:
    ```json
    {
      "summary": "string",
      "skills": [],
      "experienceBullets": [],
      "projectBullets": [],
      "coverLetterHooks": []
    }
    ```
  - Behavior Rules 적용: 과장금지, junior톤, ATS 키워드 자연 포함
- [ ] `mcp-server.ts`에 tool 등록
- [ ] 테스트

**검증:** bullet이 profile.json 기반 사실만 포함, junior 톤 유지

---

### Step 3.8 — MCP Tool: `generate_resume_markdown`
> 최종 ATS 친화 이력서 Markdown 생성

- [ ] 구현
  - 입력: `{ resumeData: ResumeBullets, template: 'ios' | 'backend' | 'fullstack' | 'ai-agent' | 'general' }`
  - 출력: `{ markdown: string }`
  - 템플릿별 섹션 순서/강조 차이
- [ ] `mcp-server.ts`에 tool 등록
- [ ] 테스트

**검증:** 생성된 Markdown이 깨끗한 ATS 친화 형식

---

### Step 3.9 — 통합 + README 업데이트

- [ ] `npm run build` 성공 확인
- [ ] 기존 27개 테스트 + 신규 테스트 전부 통과
- [ ] `profile.example.json` 작성 (민감정보 제거 버전)
- [ ] README에 Ollama 설치/실행 방법 추가
- [ ] README에 신규 4개 tool 사용법 추가
- [ ] `.env.example`에 Ollama 관련 변수 추가

**검증:**
```bash
pnpm install
ollama serve  # (별도 터미널)
pnpm dev      # MCP 서버 시작
# Claude Code / Cursor에서 analyze_jd → match_profile → generate_bullets → generate_resume_markdown 파이프라인 테스트
```

---

## Phase 4 — 고급 기능 (선택/추후)

- [ ] docx 출력 (`pandoc` 또는 `docx` npm 패키지)
- [ ] pdf 출력 (`puppeteer` 또는 `md-to-pdf`)
- [ ] 생성 결과 `documents/`에 날짜별 자동 저장
- [ ] LLM provider 런타임 전환 (ollama ↔ cloud) 지원
- [ ] A/B 이력서 버전 비교
- [ ] `qwen`, `llama` 등 다른 Ollama 모델 지원

---

## Quality Gates

| 게이트 | 기준 |
|--------|------|
| **빌드** | `npm run build` 성공 |
| **테스트** | 기존 27개 + 신규 전부 통과 |
| **Ollama 연동** | `analyze_jd` tool → gemma4:26b → JSON 반환 확인 |
| **파이프라인** | `analyze_jd → match_profile → bullets → markdown` 체인 성공 |
| **보안** | `profile.json`, `documents/`, `.env` 모두 `.gitignore` 확인 |
| **톤** | 생성된 이력서가 junior 톤, 과장 없음 확인 |

---

## Environment Variables

```bash
# Ollama Local LLM (신규)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma4:26b
LLM_TIMEOUT_MS=120000

# Cloud LLM Fallback (기존, 선택)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_API_KEY=
```

---

## MCP Tools (전체 9개)

### 기존 5개 (변경 금지)
| Tool | 설명 |
|------|------|
| `get_profile` | 프로필 조회 |
| `update_profile` | 프로필 업데이트 |
| `generate_resume` | JD 맞춤 이력서 (Cloud LLM) |
| `generate_portfolio` | 포트폴리오 (Cloud LLM) |
| `generate_cover_letter` | 자기소개서 (Cloud LLM) |

### 신규 4개 (Local LLM - Ollama)
| Tool | 입력 | 출력 |
|------|------|------|
| `analyze_jd` | `{ jdText }` | `JdAnalysis` JSON |
| `match_profile_to_jd` | `{ jdAnalysis, profile? }` | 매칭 결과 JSON |
| `generate_resume_bullets` | `{ jdAnalysis, profile?, language, tone }` | bullet 목록 JSON |
| `generate_resume_markdown` | `{ resumeData, template }` | `{ markdown }` |

---

## References

| 항목 | 위치 |
|------|------|
| MCP 서버 엔트리 | `public-resume-mcp/src/mcp-server.ts` |
| Cloud LLM Fallback | `public-resume-mcp/src/llm/llm.service.ts` |
| 프로필 데이터 | `public-resume-mcp/data/profile.json` |
| 프롬프트 | `public-resume-mcp/src/llm/prompts/` (신규) |
| Ollama adapter | `public-resume-mcp/src/llm/ollama.client.ts` (신규) |

---

## Session Log

### 2026-04-24 — Claude Code (Phase 3 플랜 수립)
- ✅ 완료: 프로젝트 전체 상태 분석 (Phase 1-2 완료 확인)
- ✅ 완료: Phase 3 DEV-PLAN 작성 (Ollama adapter + 4개 신규 MCP tool)
- ✅ 완료: 미션 대비 완성도 평가: 뼈대 70%, 미션 기준 40%
- 📊 현황: 기존 Cloud LLM fallback 동작 중, Local LLM 미구현, 신규 tool 4개 미구현
- ➡️ 다음: Step 3.1 (Ollama adapter) → Step 3.2 (프롬프트 분리) 순서로 진행

### 2026-04-17 — Claude Code (Phase 2 완성)
- ✅ 완료: MCP-NestJS 단절 수정, 프롬프트 품질 개선, TDD 27개 통과

### 2026-04-05 — Claude Code (DEV-PLAN 수립)
- ✅ 완료: DEV-PLAN.md 초안 작성
