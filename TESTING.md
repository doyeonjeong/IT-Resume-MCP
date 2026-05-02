# 로컬 테스트 & IDE 연동 가이드

이 문서는 **publish 전에 로컬에서 동작을 검증하고**, 각 AI IDE에 직접 연결해 손으로 한 번 굴려보기 위한 단계별 가이드입니다.

> 📍 **모든 명령어는 repo 루트에서 실행합니다.**
>
> ```bash
> cd /Users/doyeonjeong/Repositories/tools/resume-mcp
> ```

---

## 0. 한 줄 명령어 3종

| 목적 | 명령어 | 걸리는 시간 |
|---|---|---|
| **빠른 헬스체크** — 서버가 뜨고 9개 tool이 등록되는지 확인 | `npm run smoke` | ~5초 |
| **인터랙티브 디버그** — 브라우저에서 tool 직접 호출 | `npm run inspect` | 즉시 (브라우저 자동 오픈) |
| **publish 직전 dry-run** — 진짜 배포될 tarball을 npx로 실행 | `npm run pack:test` | ~10초 |

### 0-1. `npm run smoke`

```bash
npm run smoke
```

기대 출력:

```
✓ initialize → resume-mcp
✓ tools/list → 9 tools:
    • get_profile
    • update_profile
    • generate_resume
    • generate_portfolio
    • generate_cover_letter
    • analyze_jd
    • match_profile_to_jd
    • generate_resume_bullets
    • generate_resume_markdown
✓ smoke test passed
```

이게 통과하면 "최소한 서버는 정상이다"가 보장됩니다. 실패하면 build/import 문제이고 IDE 연결해도 어차피 안 됩니다.

### 0-2. `npm run inspect` — MCP Inspector

```bash
npm run inspect
```

`@modelcontextprotocol/inspector`가 자동으로 브라우저를 열고 GUI를 띄웁니다. 거기서:
1. 좌측에서 tool 선택 (예: `analyze_jd`)
2. JSON 입력 (예: `{ "jdText": "백엔드 개발자 모집..." }`)
3. **Run Tool** 클릭 → 응답 즉시 확인

IDE 연동 전 모든 tool을 한 번씩 굴려보고 진짜 결과가 나오는지 확인할 때 가장 빠른 방법입니다.

> 💡 cloud LLM tool(`generate_resume`, `generate_cover_letter` 등)을 inspect로 테스트하려면 환경변수에 API 키가 필요합니다. 셸에서 export하고 `npm run inspect`를 실행하세요:
> ```bash
> export GOOGLE_API_KEY=your_key
> export LLM_PROVIDER=gemini
> npm run inspect
> ```

### 0-3. `npm run pack:test` — 진짜 배포될 패키지 검증

publish 전 마지막 관문. 진짜 npm 패키지로 묶어서 `npx`로 실행하면 publish 후 사용자가 겪을 시나리오와 100% 동일합니다.

```bash
npm run pack:test
# → doyeonjeong-resume-mcp-0.1.1.tgz 생성
# → 마지막 줄에 안내가 나옴:
#   "test the packed tarball with: npx -y ./doyeonjeong-resume-mcp-0.1.1.tgz"

npx -y ./doyeonjeong-resume-mcp-0.1.1.tgz
# → 서버가 startup. Ctrl+C로 종료.
```

이걸 IDE 설정에 임시로 박아서 진짜 npx 경로로도 동작하는지 확인 가능 (다음 섹션 참고).

---

## 1. AI IDE 연결

MCP 클라이언트는 기본적으로 모두 같은 패턴을 씁니다:

```json
{
  "mcpServers": {
    "<서버이름>": {
      "command": "<실행 명령>",
      "args": ["<인자들>"],
      "env": { "<환경변수>": "<값>" }
    }
  }
}
```

차이는 **이 JSON 파일이 어디 있냐**뿐입니다.

### 공통 — 두 가지 모드

테스트할 때는 두 가지 모드 중 하나를 선택하세요:

#### 모드 A — 로컬 dev 빌드 직접 연결 (publish 전 권장)
```json
{
  "mcpServers": {
    "resume-mcp-dev": {
      "command": "node",
      "args": [
        "/Users/doyeonjeong/Repositories/tools/resume-mcp/dist/mcp-server.js"
      ],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GOOGLE_API_KEY": "여기에_본인_키"
      }
    }
  }
}
```
> 코드 수정할 때마다 `npm run build` 한 번 돌리고 IDE를 재시작 (또는 MCP 서버 reload).

#### 모드 B — npx로 배포 패키지 연결 (publish 후 사용자 시나리오)
```json
{
  "mcpServers": {
    "resume-mcp": {
      "command": "npx",
      "args": ["-y", "@doyeonjeong/resume-mcp"],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GOOGLE_API_KEY": "여기에_본인_키"
      }
    }
  }
}
```

publish 전에 모드 B를 미리 시뮬레이션하려면, args를 로컬 tarball 경로로 바꾸면 됩니다:
```json
"args": ["-y", "/Users/doyeonjeong/Repositories/tools/resume-mcp/doyeonjeong-resume-mcp-0.1.1.tgz"]
```

---

### 1-1. Antigravity IDE (Google)

**설정 파일 위치:**
- `Cmd+Shift+P → "MCP"` 검색에서 확인하세요.

**연결 후 검증:**
1. IDE 채팅에서 *"call get_profile"* 또는 *"내 프로필 보여줘"*
2. 처음이면 `~/.resume-mcp/profile.json`이 자동 생성됨
3. *"call analyze_jd with this JD: <간단한 JD 본문>"*

### 1-2. Cursor

**설정 파일:** `~/.cursor/mcp.json`

```bash
mkdir -p ~/.cursor
# 위 모드 A 또는 B의 JSON을 그대로 저장
```

저장 후 Cursor 완전 재시작. **Settings → MCP** 에서 `resume-mcp-dev` 가 초록 ●로 표시되면 연결 성공.

### 1-3. Claude Code (CLI)

**설정 파일:** `~/.claude/mcp_config.json` 또는 `.claude/mcp_config.json` (프로젝트 로컬)

```bash
cat ~/.claude/mcp_config.json
```

연결 후:
```bash
claude
> /mcp
# → resume-mcp-dev 가 connected 상태인지 확인
> get_profile 호출해줘
```

### 1-4. Cline (VS Code 확장)

**설정 파일:** VS Code Command Palette → `Cline: Open MCP Settings`
표준 JSON 형식 그대로.

### 1-5. Codex CLI (OpenAI)

Codex CLI는 현재 MCP를 직접 지원하지 않습니다 (2026-05 시점). MCP 서버를 OpenAI Codex와 연동하려면 별도의 MCP-bridge가 필요합니다. **Antigravity / Cursor / Claude Code 중 하나를 우선 검증하길 권장.**

---

## 2. 실제 검증 시나리오 (IDE 연결 후 5분 내)

IDE에서 채팅창을 열고 순서대로:

### Step 1 — 프로필 부트스트랩
> "call get_profile"

→ `~/.resume-mcp/profile.json` 자동 생성 + placeholder 내용 반환.

### Step 2 — 본인 정보로 갱신
> "내 정보로 update_profile 호출해줘. 이름은 정도연, 직무는 백엔드 개발자, 기술스택은 NestJS, TypeScript, MCP SDK"

→ profile.json이 부분 업데이트됨. `cat ~/.resume-mcp/profile.json` 으로 확인.

### Step 3 — JD 분석 (Local LLM)
> "이 JD 분석해줘: 백엔드 개발자, NestJS 경험 필수, AWS 우대"

→ `analyze_jd` 호출, 구조화 JSON 반환.

> ⚠️ 이 단계는 Ollama가 떠있어야 합니다.
> ```bash
> ollama serve &
> ollama pull gemma4:26b   # 처음 한 번만
> ```
> Ollama 없이 빠르게 검증만 하고 싶으면 Step 4로 점프.

### Step 4 — 한 방 이력서 (Cloud LLM)
> "이 JD로 이력서 만들어줘: <JD 본문>. 회사명: TestCo, 직무: 백엔드"

→ `generate_resume` 호출, markdown 이력서 반환.

이 4단계가 다 통과하면 **publish해도 안전**합니다.

---

## 3. Publish 체크리스트

```bash
# 1. 모든 검증 통과 확인
npm test            # 53/53 ✓
npm run smoke       # ✓ smoke test passed
npm run pack:test   # tarball 생성 확인

# 2. tarball 안에 민감 파일 없는지 마지막 확인
tar -tzf doyeonjeong-resume-mcp-*.tgz | grep -E "(profile\.json|\.env|documents)" || echo "✓ no sensitive files"

# 3. dry-run으로 publish 명세 확인
npm publish --dry-run

# 4. 진짜 publish (npm 로그인 필요)
npm login
npm publish

# 5. publish 직후 다른 디렉토리에서 실제 npx 동작 확인
cd /tmp && npx -y @doyeonjeong/resume-mcp
# Ctrl+C로 종료 — startup만 확인
```

---

## 4. 트러블슈팅

| 증상 | 원인 / 해결 |
|---|---|
| IDE에서 서버가 빨간색 ● (연결 실패) | `node` 경로가 PATH에 없거나 절대경로가 틀림. `which node` 확인 후 `command`를 절대경로로 |
| smoke test는 통과하는데 IDE에서 응답 없음 | IDE를 **완전 재시작**. macOS: `Cmd+Q`로 완전 종료 후 재실행 |
| `PROFILE_INCOMPLETE` 에러 | `~/.resume-mcp/profile.json`에 placeholder 값 (홍길동, 프로젝트명 등) 남아있음. 본인 정보로 덮어쓰기 |
| Cloud LLM tool 호출 시 `No LLM API key found` | IDE의 mcp 설정 `env`에 `GOOGLE_API_KEY` 등이 빠짐. **셸 export는 IDE에 안 잡힙니다** — 반드시 mcp.json `env`에 직접 박을 것 |
| `OLLAMA_CONNECTION_FAILED` | `ollama serve` 안 떠있음. 별도 터미널에서 띄우기 |
| `npx -y @doyeonjeong/resume-mcp` 가 옛날 버전 실행 | `npm cache clean --force` 후 다시 |
| publish 후 npx로 받았는데 `Cannot find module` | `files` 필드 누락된 파일이 있음. `tar -tzf` 로 tarball 내용 재확인 |
