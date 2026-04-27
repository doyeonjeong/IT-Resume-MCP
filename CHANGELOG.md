# Changelog

All notable changes to this project will be documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

## [0.1.1] - 2026-04-27

### Fixed

- `generate_resume_markdown`(및 `generate_resume`/`generate_portfolio`/`generate_cover_letter`) 출력에 LLM의 `<thought>`/`<thinking>`/`<reasoning>` reasoning 블록과 "Sure, here is..." 같은 prose prefix가 그대로 노출되던 문제. Gemma 4처럼 instruction-following이 약한 모델에서 사용자가 받는 결과가 망가지던 P0를 해소.

### Added

- `sanitizeMarkdownOutput` 유틸리티 (`src/utils/markdown-sanitizer.ts`): reasoning 메타 태그·prose prefix·외곽 code fence를 제거하고 `# header`부터 시작하는 깨끗한 markdown만 반환. 8개 단위 테스트로 Gemma-실세계 케이스 + edge case 검증.
- `GENERATE_RESUME_MARKDOWN_SYSTEM_PROMPT` 강화: prose/reasoning/leading-phrase 금지를 명시적으로 추가. 약한 모델에 대한 instruction strength 보강.

### Changed

- README에 "사용법 시나리오 (Workflow Walkthrough)" 섹션 추가. 4가지 실제 사용 패턴(빠른 1회, 단계별 정밀 생성, 프로필 관리, 자기소개서)을 입력/출력 예시와 함께 설명. 단계별 실행 시간 표 포함.

## [0.1.0] - 2026-04-27

### Changed

- Local LLM provider 모델 단순화: `'ollama' | 'huggingface' | 'mlx'` 세 종류에서 `'ollama' | 'openai-compatible'` 두 종류로 축소. MLX와 Hugging Face Router는 OpenAI-호환 endpoint preset으로 README에 문서화.
- 로컬 LLM 기본값(`LOCAL_LLM_PROVIDER`)을 `mlx` → `ollama`로 환원. Ollama는 macOS/Linux/Windows에서 모두 동작하므로 공개 레포 첫 사용 경험을 일관되게 함.
- `local-llm.factory`와 `mcp-server.ts`가 NestJS `ConfigService`를 통해 주입받도록 전환. 이전에는 `process.env`를 직접 읽어 dead duplication을 만들었음.
- `llm.config.ts`가 local LLM 기본값의 단일 source of truth로. provider별 default(baseUrl/model/apiKey)는 factory의 `PROVIDER_DEFAULTS`에서 한 곳으로 관리.
- README 구조를 "Ollama 기본 → openai-compatible (MLX/HF Router preset 예시)" 위계로 재배치. 트러블슈팅 섹션도 새 에러 코드(`INVALID_LOCAL_LLM_PROVIDER`, `LOCAL_LLM_*`)로 갱신.

### Added

- `OpenAICompatibleClient`: OpenAI Chat Completions API 호환 endpoint를 처리하는 단일 클라이언트. MLX server, Hugging Face Router, vLLM, LM Studio, Gemini OpenAI-compatible endpoint 등 어떤 호환 endpoint도 endpoint URL 변경만으로 사용 가능.
- 부트 시점 provider validation: `LOCAL_LLM_PROVIDER` 값이 `ollama`/`openai-compatible`이 아니면 `INVALID_LOCAL_LLM_PROVIDER` 에러로 즉시 실패. silent fallback 제거.
- `json-parser.contract.spec.ts`: 실제 LLM 응답 fixture를 자동 검출하여 `parseJsonFromLLM`의 contract를 검증. 현재 MLX(`mlx-analyze-jd.txt`), Gemini-via-OpenAI-compatible(`gemma4-via-gemini-api.txt`) 두 fixture 통과.
- `analyze_jd`/`match_profile_to_jd`/`generate_resume_bullets`/`generate_resume_markdown` MCP 도구 핸들러에 `maxTokens` 명시 (각각 2048/2048/3072/4096). 이전에는 미명시되어 LLM 서버 default로 응답이 잘려 `LLM_JSON_PARSE_ERROR`가 발생하던 P0를 해소.

### Removed

- `MlxClient`: `OpenAICompatibleClient`로 통합됨.
- `HuggingFaceRouterClient`: `OpenAICompatibleClient`로 통합됨.
- `OLLAMA_BASE_URL`/`OLLAMA_MODEL`/`HUGGINGFACE_*`/`HF_TOKEN` 등 vendor-specific 환경변수: `LOCAL_LLM_BASE_URL`/`LOCAL_LLM_MODEL`/`LOCAL_LLM_API_KEY` 단일 namespace로 흡수.
