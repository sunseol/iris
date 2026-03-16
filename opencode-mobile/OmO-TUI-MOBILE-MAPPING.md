# Oh My OpenCode TUI → Mobile App Feature Mapping

> 조사 완료일: 2026-03-13
> 소스: `code-yeongyu/oh-my-openagent` (구 oh-my-opencode)
> 목적: OmO TUI 기능을 모바일 앱 프론트에 반영하기 위한 사양 문서

---

## 아키텍처 이해 (중요)

OmO는 **OpenCode의 플러그인**이다. TUI 렌더링 자체는 OpenCode Core가 담당하고, OmO는 다음을 제공한다:
- 11개 특화 에이전트 + 프롬프트
- 46개 훅 (라이프사이클 인터셉터)
- 26개 도구 (해시라인 편집, 세션 관리 등)
- 카테고리 + 스킬 시스템
- 슬래시 커맨드

모바일 앱은 bridge를 통해 OpenCode CLI와 통신하므로, **OmO의 에이전트/훅/도구 시스템이 만들어내는 데이터**를 모바일 UI로 표현해야 한다.

---

## 1. 에이전트 시스템 표시

### TUI 동작
- Tab 키로 에이전트 전환 (Sisyphus ↔ Prometheus ↔ Hephaestus)
- `@agent` 멘션으로 특정 에이전트 호출 (`@oracle`, `@plan`)
- 현재 에이전트 이름이 상태바에 표시됨
- 서브에이전트(explore, librarian 등)는 백그라운드로 자동 실행

### 에이전트 목록

| 에이전트 | 역할 | 모델 | 제한 |
|----------|------|------|------|
| **Sisyphus** | 메인 오케스트레이터 | claude-opus-4-6 / kimi-k2.5 / glm-5 | - |
| **Hephaestus** | 자율 딥 워커 | gpt-5.3-codex | GPT 전용 |
| **Prometheus** | 전략 플래너 (인터뷰 모드) | claude-opus-4-6 | 읽기 전용, .sisyphus/ 내 md만 수정 |
| **Atlas** | Todo 오케스트레이터 | claude-sonnet-4-6 | 위임 불가 |
| **Oracle** | 아키텍처 컨설턴트 | gpt-5.4 | 읽기 전용 |
| **Librarian** | 문서/OSS 검색 | gemini-3-flash | 읽기 전용 |
| **Explore** | 코드베이스 grep | grok-code-fast-1 | 읽기 전용 |
| **Metis** | 갭 분석기 | claude-opus-4-6 | - |
| **Momus** | 플랜 리뷰어 | gpt-5.4 | 읽기 전용 |
| **Multimodal-Looker** | 시각 콘텐츠 분석 | gpt-5.3-codex | read만 허용 |
| **Sisyphus-Junior** | 카테고리 기반 실행자 | (카테고리에 따라 다름) | 재위임 불가 |

### 모바일 UI 제안

- **TopStatusBar**: 현재 활성 에이전트 이름 + 모델명 표시
  - 예: `🪨 Sisyphus · claude-opus-4-6`
  - 탭하면 에이전트 전환 시트 열림
- **에이전트 전환 시트**: 사용 가능한 에이전트 목록, 각각의 역할 한줄 설명, 현재 선택 표시
- **백그라운드 에이전트 인디케이터**: 서브에이전트(explore, librarian 등)가 실행 중일 때 상태바에 작은 뱃지/스피너
  - 예: `🔍 Explore 실행 중...` `📚 Librarian 검색 중...`
- **메시지 내 에이전트 태그**: assistant 메시지에 어떤 에이전트가 응답했는지 작은 라벨 표시

### bridge 프로토콜 필요사항

현재 bridge에는 에이전트 정보가 없다. 다음이 필요:
- `session.resume` 응답에 `activeAgent` 필드 추가
- `message.delta`/`message.done`에 `agent` 필드 추가
- 새 RPC: `agent.list` → 사용 가능한 에이전트 목록 반환
- 새 RPC: `agent.switch` → 에이전트 전환 요청

---

## 2. Think 태그 렌더링

### TUI 동작
- 모델이 `<think>...</think>` 블록을 생성하면 TUI에서 흐림(blur)/디밍 처리
- 사용자가 펼쳐서 볼 수 있음
- `think-mode` 훅: "think deeply", "ultrathink" 키워드 감지 → 모델 variant를 `-high`로 자동 전환
- thinking budget: Sisyphus는 32k 토큰

### 현재 bridge 처리
- `runtime-parser.js`의 `sanitizeAssistantText()`가 `<think>` 태그를 **완전 제거**
- 모바일에서는 think 콘텐츠를 아예 볼 수 없는 상태

### 모바일 UI 제안

- **ThinkBlock 컴포넌트**: 접힌 상태가 기본
  - 접힌 상태: `💭 Thinking...` 한 줄 + 흐림 처리된 미리보기 (1-2줄)
  - 펼친 상태: 전체 think 텍스트, 약간 투명도 낮춘 배경
  - 탭으로 토글
- **Think 모드 인디케이터**: 사용자가 "think deeply" 등을 입력하면 상태바에 `🧠 Deep Think` 표시

### bridge 수정 필요사항

- `runtime-parser.js`: `<think>` 태그를 제거하지 말고, 별도 필드로 분리
  ```json
  {
    "method": "message.delta",
    "params": {
      "text": "실제 응답 텍스트",
      "thinking": "<think> 블록 내용",
      "thinkingBudget": 32000,
      "thinkingUsed": 1500
    }
  }
  ```

---

## 3. 도구 호출 표시 (Tool Calls)

### TUI 동작
- 에이전트가 도구를 호출하면 TUI에 도구명 + 인자 + 결과가 표시됨
- 해시라인 편집(`LINE#ID`), LSP 도구, AST-grep 등 26개 도구
- 도구 실행 전/후 훅이 동작 (권한 체크, 출력 트렁케이션 등)

### 주요 도구 카테고리

| 카테고리 | 도구들 | 표시 방식 |
|----------|--------|-----------|
| 코드 검색 | grep, glob | 검색 결과 목록 |
| 편집 | edit (해시라인) | 파일 diff |
| LSP | lsp_diagnostics, lsp_rename, lsp_goto_definition, lsp_find_references, lsp_symbols | 진단 결과, 심볼 목록 |
| AST | ast_grep_search, ast_grep_replace | 패턴 매칭 결과 |
| 위임 | task, call_omo_agent, background_output, background_cancel | 서브에이전트 상태 |
| 시각 분석 | look_at | 이미지/PDF 분석 결과 |
| 스킬 | skill, skill_mcp | 스킬 로드 결과 |
| 세션 | session_list, session_read, session_search, session_info | 세션 데이터 |
| 터미널 | interactive_bash | tmux 세션 출력 |

### 모바일 UI 제안

- **ToolCallCard 컴포넌트**: 각 도구 호출을 접을 수 있는 카드로 표시
  - 헤더: 도구 아이콘 + 이름 + 상태 (실행 중/완료/실패)
  - 접힌 상태: 도구명 + 한줄 요약
  - 펼친 상태: 입력 파라미터 + 출력 결과
- **DiffReviewCard** (이미 존재): 해시라인 편집 결과 표시에 활용
- **DiagnosticsCard**: LSP 진단 결과를 에러/경고/정보로 분류 표시
- **SearchResultCard**: grep/glob/ast_grep 결과를 파일별로 그룹핑

### bridge 수정 필요사항

- `task.status` 이벤트에 도구 호출 상세 정보 포함:
  ```json
  {
    "method": "task.status",
    "params": {
      "sessionId": "...",
      "tool": "edit",
      "status": "running",
      "state": {
        "title": "Editing src/App.tsx",
        "input": { "filePath": "src/App.tsx", "edits": [...] },
        "output": "Applied 3 edits"
      }
    }
  }
  ```

---

## 4. 카테고리 + 스킬 시스템

### TUI 동작
- Sisyphus가 `task(category="visual-engineering", load_skills=["frontend-ui-ux"])` 형태로 위임
- 카테고리가 자동으로 최적 모델을 선택
- 스킬이 전문 지식 + MCP 도구를 주입

### 카테고리 목록

| 카테고리 | 기본 모델 | 용도 |
|----------|-----------|------|
| `visual-engineering` | gemini-3.1-pro | 프론트엔드, UI/UX |
| `ultrabrain` | gpt-5.4 (xhigh) | 깊은 논리적 추론 |
| `deep` | gpt-5.3-codex | 자율적 문제 해결 |
| `artistry` | gemini-3.1-pro (high) | 창의적 작업 |
| `quick` | claude-haiku-4-5 | 사소한 변경 |
| `unspecified-low` | claude-sonnet-4-6 | 저노력 범용 |
| `unspecified-high` | claude-opus-4-6 (max) | 고노력 범용 |
| `writing` | gemini-3-flash | 문서, 기술 작성 |

### 내장 스킬

| 스킬 | 트리거 | 설명 |
|------|--------|------|
| `git-master` | commit, rebase, squash | Git 전문가. 커밋 스타일 자동 감지, 원자적 커밋 분할 |
| `playwright` | 브라우저 작업 | Playwright MCP를 통한 브라우저 자동화 |
| `frontend-ui-ux` | UI/UX 작업 | 디자이너-개발자 페르소나. 대담한 미적 방향 |
| `dev-browser` | 상태 유지 브라우저 | 인증 세션 유지 브라우저 자동화 |

### 모바일 UI 제안

- **위임 상태 표시**: 메시지 타임라인에 위임 이벤트 카드
  - `🎯 visual-engineering 카테고리로 위임 중...`
  - `📦 스킬 로드: frontend-ui-ux, playwright`
  - 서브에이전트 진행 상태 바
- **카테고리 선택기**: 사용자가 직접 카테고리를 지정하고 싶을 때 (고급 기능)
  - ComposerBar에 카테고리 칩 추가 가능

### bridge 프로토콜 필요사항

- 새 이벤트: `delegation.started` / `delegation.completed`
  ```json
  {
    "method": "delegation.started",
    "params": {
      "sessionId": "...",
      "category": "visual-engineering",
      "skills": ["frontend-ui-ux"],
      "taskDescription": "Add responsive chart component"
    }
  }
  ```

---

## 5. 슬래시 커맨드

### TUI 동작
- `/` 입력 시 자동완성 드롭다운 표시
- 커맨드 실행 시 해당 훅/기능이 활성화

### 내장 커맨드

| 커맨드 | 설명 | 모바일 관련성 |
|--------|------|--------------|
| `/init-deep` | 계층적 AGENTS.md 생성 | ⭐ 프로젝트 초기화에 유용 |
| `/ralph-loop` | 완료까지 자기참조 루프 | ⭐⭐ 장시간 작업 모니터링 |
| `/ulw-loop` | ultrawork 모드 루프 | ⭐⭐ 장시간 작업 모니터링 |
| `/cancel-ralph` | Ralph Loop 취소 | ⭐⭐ 긴급 중단 |
| `/refactor` | LSP+AST 리팩토링 | ⭐ 코드 변경 리뷰 |
| `/start-work` | Prometheus 플랜 실행 | ⭐⭐ 계획 기반 작업 시작 |
| `/stop-continuation` | 모든 연속 메커니즘 중단 | ⭐⭐⭐ 긴급 중단 |
| `/handoff` | 세션 핸드오프 문서 생성 | ⭐ 세션 간 연속성 |

### 모바일 UI 제안 (이미 설계됨)

- **CommandComposer**: `/` 입력 시 드롭다운 자동완성 (이미 존재)
- 추가 필요:
  - 커맨드별 아이콘
  - 실행 중 상태 표시 (특히 `/ralph-loop`, `/ulw-loop`)
  - `/stop-continuation` 은 긴급 중단 버튼으로도 노출

### bridge 프로토콜 필요사항

- 새 RPC: `command.list` → 사용 가능한 슬래시 커맨드 목록
- 기존 `message.send`로 `/` 프리픽스 메시지 전송하면 bridge가 커맨드로 처리

---

## 6. 상태바 정보

### TUI 동작
- 하단 상태바에 표시되는 정보:
  - 현재 에이전트/모델
  - 토큰 사용량 (입력/출력/남은량)
  - 비용 추적
  - 세션 ID
  - 백그라운드 태스크 수

### 모바일 UI 제안

- **TopStatusBar** (이미 존재) 확장:
  - 왼쪽: 에이전트 아이콘 + 이름
  - 중앙: 세션 제목 (탭하면 세션 전환)
  - 오른쪽: 토큰/비용 뱃지
- **토큰/비용 시트**: TopStatusBar의 토큰 뱃지 탭 시 상세 정보
  - 입력 토큰, 출력 토큰, 총 비용
  - 세션별 누적 비용
  - 컨텍스트 윈도우 사용률 바

### bridge 프로토콜 필요사항

- `opencode stats` CLI 출력을 RPC로 노출:
  ```json
  {
    "method": "stats.get",
    "result": {
      "session": {
        "inputTokens": 15000,
        "outputTokens": 8000,
        "cost": 0.45,
        "contextWindowUsage": 0.35
      },
      "total": {
        "inputTokens": 150000,
        "outputTokens": 80000,
        "cost": 4.50
      }
    }
  }
  ```

---

## 7. 백그라운드 에이전트 표시

### TUI 동작
- `run_in_background=true`로 에이전트 실행
- tmux 활성화 시 별도 pane에서 실시간 출력 확인 가능
- 완료 시 OS 알림 (`session-notification` 훅)
- `background_output(task_id="...")` 로 결과 수집

### 모바일 UI 제안

- **BackgroundTaskBar**: 화면 하단 ComposerBar 위에 슬라이드 가능한 바
  - 실행 중인 백그라운드 태스크 수 표시
  - 탭하면 태스크 목록 시트 열림
- **BackgroundTaskSheet**: 각 태스크의 상태
  - 에이전트 이름 + 설명
  - 진행 상태 (실행 중/완료/실패)
  - 완료된 태스크는 결과 미리보기
  - 개별 취소 버튼
- **푸시 알림**: 백그라운드 태스크 완료 시 모바일 알림
  - OmO의 `session-notification` 훅과 동일한 역할

### bridge 프로토콜 필요사항

- 새 이벤트: `background.started` / `background.completed` / `background.failed`
- 새 RPC: `background.list` → 실행 중인 백그라운드 태스크 목록

---

## 8. Todo/Task 시스템

### TUI 동작
- `todowrite` 도구로 할일 목록 생성/관리
- `todo-continuation-enforcer` 훅: 에이전트가 idle 상태가 되면 미완료 todo를 상기시켜 작업 재개 강제
- 상태: `pending` → `in_progress` → `completed` / `cancelled`
- 실험적 `task_system`: 파일 시스템 기반 영속적 태스크 (의존성 지원)

### Todo Continuation Enforcer 동작
```
[SYSTEM REMINDER - TODO CONTINUATION]

You have incomplete todos! Complete ALL before responding:
- [ ] Implement user service ← IN PROGRESS
- [ ] Add validation
- [ ] Write tests

DO NOT respond until all todos are marked completed.
```

### 모바일 UI 제안

- **TodoProgressBar**: 메시지 타임라인 상단에 고정
  - 전체 진행률 바 (완료/전체)
  - 현재 진행 중인 항목 하이라이트
  - 탭하면 전체 목록 시트
- **TodoListSheet**: 전체 할일 목록
  - 상태별 색상 (pending=회색, in_progress=파랑, completed=초록, cancelled=빨강)
  - 우선순위 표시 (high/medium/low)
- **인라인 Todo 카드**: 에이전트가 todowrite를 호출할 때 메시지 타임라인에 카드로 표시

### bridge 프로토콜 필요사항

- 새 이벤트: `todo.updated`
  ```json
  {
    "method": "todo.updated",
    "params": {
      "sessionId": "...",
      "todos": [
        { "content": "Implement user service", "status": "in_progress", "priority": "high" },
        { "content": "Add validation", "status": "pending", "priority": "medium" }
      ]
    }
  }
  ```

---

## 9. 키워드 감지 (Keyword Detector)

### TUI 동작
- `keyword-detector` 훅이 사용자 입력에서 키워드를 감지하여 모드 활성화:
  - `ultrawork` / `ulw` → 최대 성능 모드 (병렬 에이전트, 백그라운드 태스크, 공격적 탐색)
  - `search` / `find` → 병렬 탐색 모드
  - `analyze` / `investigate` → 심층 분석 모드

### 모바일 UI 제안

- 키워드 감지는 bridge/OpenCode 측에서 처리되므로 모바일에서는 **모드 상태 표시**만인디케이터**: TopStatusBar에 현재 활성 모드 뱃지
  - `⚡ Ultrawork` (주황)
  - `🔍 Search` (파랑)
  - `🔬 Analyze` (보라)

---

## 10. Ralph Loop / Ultrawork Loop

### TUI 동작
- `/ralph-loop "목표"` → 목표 달성까지 자동 반복 (최대 100회)
- `<promise>DONE</promise>` 감지 시 완료
- 자동 연속: 에이전트가 중간에 멈추면 자동 재개
- `/cancel-ralph` 로 중단

### 모바일 UI 제안

- **LoopStatusBanner**: 루프 활성 시 화면 상단에 배너
  - `🔄 Ralph Loop 실행 중 (반복 12/100)`
  - 진행률 바
  - 중단 버튼 (빨간색)
- **루프 히스토리**: 각 반복의 요약을 타임라인에 접을 수 있는 카드로 표시

---

## 11. 세션 알림 (Session Notification)

### TUI 동작
- `session-notification` 훅: 에이전트가 idle 상태가 되면 OS 알림
- 질문 대기 시: "Agent is asking a question"
- 권한 요청 시: "Agent needs permission to continue"
- 일반 idle 시: "Agent is ready for input"
- macOS/Linux/Windows 모두 지원

### 모바일 UI 제안

- **푸시 알림**: 모바일 네이티브 알림으로 매핑
  - 질문 대기: 높은 우선순위 알림 + 소리
  - 권한 요청: 높은 우선순위 알림 + 진동
  - 일반 idle: 낮은 우선순위 알림
- **인앱 알림**: 앱이 포그라운드일 때 토스트/배너

### bridge 프로토콜 필요사항

- 새 이벤트: `notification.idle` / `notification.question` / `notification.permission`

---

## 구현 우선순위 제안

### P0 (핵심 — 없으면 OmO 경험이 아님)
1. **에이전트 표시** — 현재 에이전트/모델 표시, 에이전트 전환
2. **Think 태그 렌더링** — blur/접기 처리
3. **도구 호출 표시** — ToolCallCard 컴포넌트

### P1 (중요 — OmO 파워유저 경험)
4. **Todo/Task 진행률** — TodoProgressBar
5. **백그라운드 에이전트** — BackgroundTaskBar
6. **상태바 확장** — 토큰/비용 표시

### P2 (부가 — 완성도)
7. **Ralph Loop 상태** — LoopStatusBanner
8. **카테고리/스킬 표시** — 위임 이벤트 카드
9. **키워드 모드 인디케이터**
10. **세션 알림** — 푸시 알림 연동

---

## bridge 프로토콜 확장 요약

### 새 RPC 메서드
| 메서드 | 설명 |
|--------|------|
| `agent.list` | 사용 가능한 에이전트 목록 |
| `agent.switch` | 에이전트 전환 |
| `command.list` | 슬래시 커맨드 목록 |
| `stats.get` | 토큰/비용 통계 |
| `background.list` | 백그라운드 태스크 목록 |

### 새 이벤트
| 이벤트 | 설명 |
|--------|------|
| `delegation.started` / `delegation.completed` | 카테고리 위임 상태 |
| `background.started` / `background.completed` / `background.failed` | 백그라운드 태스크 |
| `todo.updated` | Todo 목록 변경 |
| `notification.idle` / `notification.question` / `notification.permission` | 세션 알림 |

### 기존 프로토콜 확장
| 대상 | 추가 필드 |
|------|-----------|
| `message.delta` / `message.done` | `agent`, `thinking`, `thinkingBudget`, `thinkingUsed` |
| `session.resume` 응답 | `activeAgent`, `activeModel` |
| `task.status` | `tool` 상세 정보 (input/output) |

---

## 참고 자료

- **OmO 소스**: `C:/Users/keduall/AppData/Local/Temp/oh-my-openagent`
- **OmO 문서**: `docs/guide/overview.md`, `docs/guide/orchestration.md`, `docs/reference/features.md`
- **에이전트 정의**: `src/agents/` (sisyphus.ts, oracle.ts, explore.ts 등)
- **훅 시스템**: `src/hooks/` (46개 훅)
- **도구 시스템**: `src/tools/` (26개 도구)
- **OmO 설정**: `~/.config/opencode/oh-my-opencode.json`
- **OpenCode Core TUI**: https://opencode.ai/docs/tui/
