# Resume-MCP — 오픈소스 공개 전 체크리스트

본 레포를 Public으로 전환하기 전에 도연이 직접 확인해야 할 항목들.

## 자동 처리됨
- [x] LICENSE (MIT) — `6c83fdd`
- [x] CONTRIBUTING.md — `6c83fdd`
- [x] 본 체크리스트 (이번 커밋)

## 수동 처리 필요

### 보안 / 시크릿
- [ ] **Google API 키 revoke + 재발급**: 로컬 `.env`에 노출된 키 (gitignored이지만 실제 사용 키)
- [ ] `.env` 삭제 후 `.env.example`만 유지하고 첫 push (현재 .gitignore 보호됨)
- [ ] `data/profile.json` (실명·이메일 포함) `.gitignore` 등재 확인 ✓ (이미 등재됨)

### 문서
- [ ] README 검수 — 실제 도구(generate_resume / generate_portfolio /
  generate_cover_letter) 노출 매핑 정확한지
- [ ] LICENSE / CONTRIBUTING / 영문 README 검수

### 기타
- [ ] npm publish 여부 결정 (선택 — 공개 패키지화하면 차별성 큼)

---

## 🔐 Pre-public Security Checklist (자동 스캔 결과)

**스캔 일시**: 2026-04-26
**도구**: 정규식 grep (Anthropic / OpenAI / Google / Slack / Discord / HF / Sentry / generic password 패턴)

### 발견된 시크릿

| # | 위치 | Line | 종류 | Prefix (앞 4-6자) | 현재 / 히스토리 |
|---|------|------|------|--------------------|---------------|
| 1 | `public-resume-mcp/.env` | 7 | Google API Key (Gemini) | `AIzaSy` | **현재만** (gitignored, NOT in commits) |

**히스토리**: 깨끗 (현재 커밋 1개만 존재 — `6c83fdd`. .env는 추적된 적 없음.)

**정상 (placeholder)**:
- `README.md:96-98`, `env.example:5-7`, `DEV-PLAN.md:365-367` — 모두 `your-...-key-here` 형태

### 처리 절차

- [ ] **(1) 키 revoke + rotate**: Google AI Studio (<https://aistudio.google.com/apikey>)에서
  `AIzaSy...` prefix 키 폐기 → 신규 발급 → 로컬 `.env` 갱신
- [ ] **(2) git history scrub**: 불필요 (히스토리에 시크릿 없음). filter-repo / BFG 작업 SKIP.
- [ ] **(3) 인프라 비밀번호 rotate**: 해당 없음 (DB/Redis/n8n 사용 안 함)
- [ ] **(4) 최종 pre-public review**:
  - [ ] `git ls-files | grep -iE "(secret|key|token|password|credential)"` 결과 검토
  - [ ] `git log -p | grep -iE "AIza|sk-|xox[bp]-"` 0줄 확인
  - [ ] `.env`, `data/profile.json`, `documents/`이 모두 .gitignore에 있는지 재확인
  - [ ] **Settings → Visibility → Public** 전환 (도연이 직접, 본 작업 범위 외)

---

## 참고
- 마스터 플랜: 도연 Obsidian wiki/opensource_migration_plan.md
- 본 프로젝트는 공개 난이도 ⭐⭐ — 시크릿 1개 (로컬만), 히스토리 깨끗하여 가장 빠른 공개 가능
