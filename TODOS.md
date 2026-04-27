# TODOS

이 파일은 향후 작업으로 미뤄둔 항목을 기록합니다.

## In-scope for 현재 PR (Decision 1 + T1~T4 / 별도 추적 불필요)

이번 PR에 포함되는 작업은 PR description에서 직접 추적합니다. 참고용:

- **Decision 1:** 공개 레포 기본 `LOCAL_LLM_PROVIDER` = `ollama`로 환원. (default revert)
- **T1 (Codex 1):** local LLM provider를 `ollama` + `openai-compatible` 둘로 축소. `mlx.client.ts` 삭제, `huggingface.client.ts` → `openai-compatible.client.ts`로 일반화. README/env.example은 MLX/HF Router를 `openai-compatible` provider의 endpoint preset으로 재구성.
- **T2 (Codex 2):** factory와 mcp-server를 NestJS ConfigService 주입으로 전환. `process.env` 직접 접근 제거.
- **T3 (Codex 5):** `LOCAL_LLM_PROVIDER` 값 검증 — 부트 시점에 unknown 값이면 명확한 에러로 실패.
- **T4 (Codex 4):** MLX 실제 응답을 한 번 수집하여 fixture로 저장, `json-parser`에 먹이는 unit test 추가.
- **Codex 3 (자연 반영):** README 섹션 구조를 "Ollama 기본 → openai-compatible (MLX/HF preset 예시)"로 재배열.
- **Codex 6 (자연 반영):** `llm.config.ts`가 default 단일 source of truth가 되도록 정리.

## Refactors / Cleanup (별도 PR)

### 1. OllamaClient `chat()` 단위 테스트 추가
- **What:** Ollama client `chat()` 동작 단위 테스트 작성 (해피패스, 빈 응답, 타임아웃 AbortError, 연결 거부 TypeError, HTTP non-2xx).
- **Why:** T4의 fixture 기반 contract 테스트는 OpenAI-compatible 경로만 커버. Ollama는 `fetch` 직접 호출이라 별도 spec 필요.
- **Pros:** 에러 매핑 회귀 방지. Node `fetch` 동작 변화 시 안전망.
- **Cons:** Mock 셋업(node `fetch` mocking + AbortController) 시간 필요.
- **Context:** 2026-04-26 plan-eng-review. T1/T2 PR 후속. Ollama 클래스가 정리된 후에 작성하면 mock 설계가 깔끔.
- **Depends on:** 없음. T1 PR과 독립적으로 진행 가능.

### 2. MCP stdio end-to-end 테스트
- **What:** `mcp-server.ts`를 별도 프로세스로 띄우고 stdio MCP 프로토콜로 `get_profile`, `analyze_jd` 등을 호출하는 통합 테스트 한 세트.
- **Why:** 현재 단위 테스트는 service/client 레이어만. MCP 도구 등록·input schema·response 직렬화 등 stdio 경로의 회귀를 잡지 못함. README "알려진 한계"에도 명시.
- **Pros:** 공개 레포에서 가장 자주 깨질 수 있는 통합 지점을 보호.
- **Cons:** stdio 모킹/스폰이 jest 환경에서 비표준. 별도 jest 프로젝트 또는 vitest 분리가 더 깔끔할 수 있음.
- **Context:** 2026-04-26 plan-eng-review. 별도 PR로.
- **Depends on:** 없음.

### 3. 모든 LLM client 에러 메시지 영문 통일
- **What:** `OllamaClient`의 한국어 fallback 메시지를 영문으로 정리. T1 PR에서 `OpenAICompatibleClient`는 자연스럽게 영문 통일됨 (HF 베이스).
- **Why:** 공개 레포 일관성. 영어권 사용자/contributor 진입 장벽 감소. README 트러블슈팅 섹션은 한국어 유지로 보완.
- **Pros:** 일관된 톤. 에러 검색 시 영어권 결과와 매칭.
- **Cons:** 한국 사용자에게 약간 덜 친절해짐 (트러블슈팅 README가 보완).
- **Context:** 2026-04-26 plan-eng-review. T1 PR 후속 정리. T1에서 mlx.client 삭제되므로 잔존 한국어 메시지는 Ollama만.
- **Depends on:** TODO #1 (Ollama 단위 테스트)와 같이 묶어서 진행 가능.

### 4. (선택) ollama용 contract fixture
- **What:** Ollama 실제 응답을 fixture로 캡처하여 `json-parser` contract 테스트에 추가.
- **Why:** T4가 openai-compatible 경로만 커버. Ollama가 OpenAI-호환과 다른 응답 shape를 반환하면 같은 분류 위험.
- **Pros:** 100% vendor coverage. Boil-the-lake 완성.
- **Cons:** Ollama 환경 1회 수집 필요.
- **Context:** 2026-04-26 plan-eng-review T4의 vendor 확장. Codex C 옵션이 권한 boil-the-lake.
- **Depends on:** TODO #1.
