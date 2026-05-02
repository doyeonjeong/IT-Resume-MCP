# Resume MCP

> **로컬 전용 MCP 서버.** 채용 공고(JD)를 입력하면 본인 프로필을 바탕으로 맞춤 이력서를 생성합니다.
> 프로필과 생성된 문서는 **사용자 머신을 떠나지 않습니다.** LLM 호출만 본인 API 키로 외부에 나가고, Local LLM(Ollama)을 쓰면 완전 오프라인입니다.

[![npm](https://img.shields.io/npm/v/@doyeonjeong/resume-mcp.svg)](https://www.npmjs.com/package/@doyeonjeong/resume-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

대부분의 이력서 AI 도구는 본인 경력 데이터를 자기네 서버에 업로드합니다. 이 도구는 그러지 않습니다. 프로필은 사용자 디스크의 `~/.resume-mcp/profile.json`에 그대로 있고, MCP 서버는 Cursor / Claude Code / Antigravity 등 이미 쓰고 있는 클라이언트 안에서 로컬 프로세스로 돕니다 — 제3자 SaaS가 데이터를 들고 있을 일이 없습니다.

## 왜 MCP고, 왜 로컬인가

- **Privacy by design** — 프로필 JSON은 사용자 파일시스템에만 존재. DB 없음, 클라우드 동기화 없음, 텔레메트리 없음.
- **재사용 가능** — 경력 데이터를 한 번 작성하면 수십 번의 맞춤 이력서로 재활용.
- **조립형 파이프라인** — `analyze_jd → match_profile_to_jd → generate_resume_bullets → generate_resume_markdown` 으로 단계 분리. 중간에 사용자가 개입 가능.
- **AI IDE 네이티브** — Cursor, Claude Code, Cline, Antigravity 등 MCP 호환 클라이언트에서 동작.

## 설치 (60초)

MCP 클라이언트 설정 (예: `~/.cursor/mcp.json`, `~/.claude/mcp_config.json`)에 한 줄 등록:

```json
{
  "mcpServers": {
    "resume-mcp": {
      "command": "npx",
      "args": ["-y", "@doyeonjeong/resume-mcp"],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GOOGLE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

끝. 클라이언트를 재시작하고 *"call get_profile"* 이라고 입력하세요. 첫 호출 시 `~/.resume-mcp/profile.json`이 템플릿으로 자동 생성됩니다.

### LLM Provider 선택

Cloud LLM은 한 방 생성 tool에 사용됩니다. 가지고 있는 키 중 아무거나 선택:

```json
"env": {
  "LLM_PROVIDER": "claude",     // 또는 "openai" | "gemini"
  "ANTHROPIC_API_KEY": "...",
  "OPENAI_API_KEY": "...",
  "GOOGLE_API_KEY": "..."
}
```

단계형 파이프라인(`analyze_jd`, `match_profile_to_jd` 등)은 기본적으로 **Local LLM**을 사용합니다. Ollama(권장) 또는 OpenAI 호환 endpoint:

```json
"env": {
  "LOCAL_LLM_PROVIDER": "ollama",
  "LOCAL_LLM_MODEL": "gemma4:26b"
}
```

## 프로필 세팅

`~/.resume-mcp/profile.json`을 본인 경력 데이터로 채우세요:

```json
{
  "name": "정도연",
  "title": "Backend Developer",
  "summary": "...",
  "skills": ["NestJS", "TypeScript", "..."],
  "projects": [
    {
      "title": "프로젝트명",
      "period": "2025.01 ~ 2025.06",
      "role": "백엔드 리드",
      "description": "본인이 실제로 한 일",
      "techStack": ["..."],
      "achievements": "구체적이고 사실 기반 성과",
      "githubUrl": "https://github.com/you/project"
    }
  ]
}
```

또는 AI에게 대화로 채우게 시키기:

> "내 프로필 업데이트해줘. 스킬은 NestJS, TypeScript, Python, MCP SDK"

→ AI가 `update_profile` 호출 → 파일이 부분 업데이트됨.

placeholder 값(`홍길동`, `프로젝트명`, `username/project`)이 남아있으면 서버가 **생성을 거부**합니다 — 보일러플레이트 이력서가 잘못 나가는 사고를 막아줍니다.

### 프로필 위치 변경

```json
"env": {
  "RESUME_MCP_PROFILE_PATH": "/path/to/your/profile.json"
}
```

## 사용 시나리오

### 시나리오 1 — JD 입력, 이력서 한 방

채팅에 JD 본문 붙여넣기:

> "이 JD로 이력서 만들어줘. 회사: ROSAIC, 직무: LLM 엔지니어.\n\n<JD 본문>"

→ AI가 `generate_resume({ jdText, companyName, position, language: "ko" })` 호출 → markdown 이력서 10~20초 내.

### 시나리오 2 — 단계별 파이프라인 (정확도 ↑, 권장)

4개 tool, 각 단계마다 사용자 개입 가능:

| 단계 | Tool | 출력 |
|---|---|---|
| 1 | `analyze_jd` | 구조화 JSON: 필수/우대 스킬, ATS 키워드, risk factors |
| 2 | `match_profile_to_jd` | strong matches, partial matches, **과장하면 안 되는 항목** |
| 3 | `generate_resume_bullets` | ATS 친화 bullet, summary, 자소서 hooks |
| 4 | `generate_resume_markdown` | 최종 markdown, 템플릿 선택 (`general` / `backend` / `fullstack` / `ios` / `ai-agent`) |

총 ~90초 (Local LLM 기준). 핵심은 2단계 — *"이건 과장이다"*를 사전에 잡아주는 안전장치.

### 시나리오 3 — 자기소개서 한 방

> "이 JD로 자기소개서 써줘"

→ `generate_cover_letter({ jdText, companyName, position, language: "ko" })`

### 시나리오 4 — 포트폴리오 요약본

> "내 프로필을 포트폴리오 한 장으로 정리해줘"

→ `generate_portfolio({ language: "ko" })`

## MCP Tools

| Tool | 용도 |
|---|---|
| `get_profile` | 현재 프로필 조회 |
| `update_profile` | 프로필 JSON 부분 업데이트 |
| `generate_resume` | JD 맞춤 이력서 한 방 생성 (Cloud LLM) |
| `generate_portfolio` | 포트폴리오 요약본 (Cloud LLM) |
| `generate_cover_letter` | 자기소개서 (Cloud LLM) |
| `analyze_jd` | JD를 구조화 JSON으로 분석 (Local LLM) |
| `match_profile_to_jd` | JD 분석 × 프로필 → 매칭 리포트 (Local LLM) |
| `generate_resume_bullets` | ATS 친화 bullet (Local LLM) |
| `generate_resume_markdown` | 최종 markdown 이력서 (Local LLM) |

## 환경변수

| 변수 | 기본값 | 설명 |
|---|---|---|
| `LLM_PROVIDER` | `gemini` | `claude` / `openai` / `gemini` |
| `ANTHROPIC_API_KEY` | — | `LLM_PROVIDER=claude`일 때 필수 |
| `OPENAI_API_KEY` | — | `LLM_PROVIDER=openai`일 때 필수 |
| `GOOGLE_API_KEY` | — | `LLM_PROVIDER=gemini`일 때 필수 |
| `LOCAL_LLM_PROVIDER` | `ollama` | `ollama` / `openai-compatible` |
| `LOCAL_LLM_BASE_URL` | provider 기본값 | Ollama: `http://localhost:11434` |
| `LOCAL_LLM_MODEL` | provider 기본값 | 예: `gemma4:26b` |
| `LOCAL_LLM_API_KEY` | — | OpenAI 호환 endpoint(HF Router 등) 토큰 |
| `LLM_TIMEOUT_MS` | `120000` | per-call timeout |
| `RESUME_MCP_PROFILE_PATH` | `~/.resume-mcp/profile.json` | 프로필 경로 override |

## Local LLM 셋업

### 옵션 A — Ollama (권장)

```bash
brew install ollama          # 또는 https://ollama.com/download
ollama pull gemma4:26b
ollama serve
```

MCP 환경변수:
```json
"LOCAL_LLM_PROVIDER": "ollama",
"LOCAL_LLM_MODEL": "gemma4:26b"
```

### 옵션 B — OpenAI 호환 endpoint (MLX, vLLM, LM Studio, HF Router…)

```json
"LOCAL_LLM_PROVIDER": "openai-compatible",
"LOCAL_LLM_BASE_URL": "http://localhost:8080/v1",
"LOCAL_LLM_MODEL": "mlx-community/gemma-4-26b-a4b-it-4bit",
"LOCAL_LLM_API_KEY": "any-non-empty-string"
```

## 트러블슈팅

| 에러 | 해결 |
|---|---|
| `PROFILE_INCOMPLETE` | `~/.resume-mcp/profile.json`에 placeholder가 남아있음. `홍길동`, `프로젝트명` 등을 실제 값으로 교체 |
| `OLLAMA_CONNECTION_FAILED` | `ollama serve` 실행 (기본 포트 11434) |
| `LOCAL_LLM_CONNECTION_FAILED` | OpenAI 호환 endpoint 미접속. `LOCAL_LLM_BASE_URL` 확인 |
| `LOCAL_LLM_AUTH_FAILED` | `LOCAL_LLM_API_KEY` 누락/잘못됨. HF Router는 토큰 권한 확인 |
| `LOCAL_LLM_MODEL_UNAVAILABLE` | 모델이 서빙 안 됨. `ollama pull <model>` 또는 다른 모델 선택 |
| `No LLM API key found` | Cloud tool 사용 시 `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_API_KEY` 중 최소 하나 필요 |

## 로컬 개발

```bash
git clone https://github.com/doyeonjeong/IT-Resume-MCP.git
cd IT-Resume-MCP
npm install
cp env.example .env
```

### 한 줄 명령어 3종

```bash
npm run smoke       # 5초 — 서버 부팅 + 9개 tool 등록 확인 (publish 전 헬스체크)
npm run inspect     # 브라우저 GUI에서 모든 tool 인터랙티브 호출 (MCP Inspector)
npm run pack:test   # 진짜 npm tarball 만들어서 publish 시뮬레이션
```

자세한 IDE 연결 방법(Antigravity, Cursor, Claude Code, Cline 등)과 5분 검증 시나리오는 [TESTING.md](./TESTING.md) 참고.

### 기본 명령어

```bash
npm test            # 단위 테스트 (53개)
npm run build       # NestJS 빌드 + chmod +x
npm run mcp         # tsx로 dev 모드 실행
```

로컬 dev 빌드를 MCP 클라이언트에 등록:

```json
{
  "mcpServers": {
    "resume-mcp-dev": {
      "command": "node",
      "args": ["/absolute/path/to/IT-Resume-MCP/dist/mcp-server.js"]
    }
  }
}
```

## 기술 스택

NestJS 11 · TypeScript · MCP SDK · Ollama · OpenAI / Anthropic / Gemini SDKs · Zod

## License

MIT — [LICENSE](./LICENSE) 참고.
