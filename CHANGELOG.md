# Changelog

All notable changes to this project will be documented here.
This project follows [Keep a Changelog](https://keepachangelog.com/) and [Semantic Versioning](https://semver.org/).

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
