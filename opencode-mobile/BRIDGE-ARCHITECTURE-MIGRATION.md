# Bridge 아키텍처 마이그레이션 가이드

> `opencode run --format json` (매번 새 프로세스) -> `opencode serve` + `opencode run --attach` (영속 서버) 전환

## 목차

1. [배경 및 동기](#1-배경-및-동기)
2. [현재 아키텍처 (AS-IS)](#2-현재-아키텍처-as-is)
3. [목표 아키텍처 (TO-BE)](#3-목표-아키텍처-to-be)
4. [CLI 레퍼런스](#4-cli-레퍼런스)
5. [구현 단계](#5-구현-단계)
6. [파일별 변경 명세](#6-파일별-변경-명세)
7. [환경변수](#7-환경변수)
8. [검증 체크리스트](#8-검증-체크리스트)
9. [롤백 계획](#9-롤백-계획)

---

## 1. 배경 및 동기

### 현재 문제점

현재 bridge는 사용자가 메시지를 보낼 때마다 `opencode run --format json "메시지"` 명령으로 **새 프로세스를 spawn**한다. 이 방식의 문제:

1. **플러그인 미로드**: `opencode run` one-shot 모드에서는 oh-my-opencode 등 플러그인이 완전히 로드되지 않음
2. **Think 블록 미지원**: `--format json`만으로는 thinking 데이터가 strip됨
3. **세션 컨텍스트 단절**: 매 메시지마다 새 프로세스이므로 OpenCode 내부 세션 상태가 유지되지 않음
4. **느린 응답**: 매번 OpenCode 런타임 초기화 오버헤드 발생

### 해결 방향

`opencode serve`로 **영속 서버 프로세스**를 하나 띄우고, 각 메시지는 `opencode run --attach <url>`로 해당 서버에 연결하여 처리한다.

- 플러그인이 serve 프로세스에서 완전히 로드됨
- `--thinking` 플래그로 reasoning 이벤트를 별도 수신
- 세션 상태가 serve 프로세스 내에서 영속

### 참조 프로젝트: Remodex

[Remodex](https://github.com/Emanuele-web04/remodex) 프로젝트가 동일한 패턴을 사용한다:
- `phodex-bridge/src/codex-transport.js` — `codex app-server` (영속 프로세스) spawn
- `phodex-bridge/src/bridge.js` — 릴레이 + 코덱스 양방향 포워딩

우리도 동일한 영속 서버 패턴을 채택하되, OpenCode CLI의 `serve` + `run --attach` 조합을 사용한다.

---

## 2. 현재 아키텍처 (AS-IS)

```
┌─────────┐     WebSocket      ┌──────────┐    spawn per msg    ┌──────────────┐
│  Mobile  │ <───────────────> │  Bridge   │ ──────────────────> │ opencode run │
│   App    │                   │ server.js │    (one-shot)       │ --format json│
└─────────┘                   └──────────┘                     └──────────────┘
                                    │                                 │
                              adapter-factory.js              프로세스 종료 후
                                    │                           다음 메시지에
                              runtime-adapter.js              새 프로세스 spawn
                              (ProcessBackedOpenCodeAdapter)
```

### 핵심 파일

| 파일 | 역할 |
|------|------|
| `bridge/src/adapter-factory.js` | `OPENCODE_BRIDGE_MODE` 환경변수로 어댑터 선택 |
| `bridge/src/runtime-adapter.js` | `ProcessBackedOpenCodeAdapter` — 메시지마다 `opencode run` spawn |
| `bridge/src/runtime-parser.js` | stdout JSON 라인 파싱, 이벤트 핸들러 호출 |
| `bridge/src/server.js` | WebSocket 서버, JSON-RPC 라우팅, broadcast |

### 현재 데이터 흐름

1. App -> Bridge: `message.send` RPC
2. Bridge: `spawn('opencode', ['run', '--format', 'json', text])`
3. OpenCode stdout -> `runtime-parser.js` -> 이벤트 핸들러
4. Bridge -> App: `message.delta`, `message.done`, `task.status` 등 broadcast

---

## 3. 목표 아키텍처 (TO-BE)

```
┌─────────┐     WebSocket      ┌──────────┐                    ┌──────────────────┐
│  Mobile  │ <───────────────> │  Bridge   │ ── manage ──────> │  opencode serve  │
│   App    │                   │ server.js │    (lifecycle)     │  (영속 프로세스)   │
└─────────┘                   └──────────┘                     │  port 14097      │
                                    │                           └──────────────────┘
                              adapter-factory.js                        ^
                                    │                                   │
                              serve-adapter.js          opencode run --attach
                              (ServeBackedOpenCodeAdapter)    per message
```

### 핵심 변경

1. **새 어댑터**: `ServeBackedOpenCodeAdapter` (serve-adapter.js)
2. **serve 프로세스 관리**: bridge 시작 시 `opencode serve` spawn, bridge 종료 시 kill
3. **메시지 전송**: `opencode run --attach http://127.0.0.1:<port> --format json --thinking --session <id> "text"` spawn
4. **새 이벤트 타입**: `reasoning` (thinking 대체), `step_finish` (토큰 사용량 포함)
5. **기존 어댑터 보존**: `ProcessBackedOpenCodeAdapter`는 fallback으로 유지

---

## 4. CLI 레퍼런스

### opencode serve

영속 서버를 시작한다. bridge가 시작될 때 한 번 spawn하고, bridge 종료 시 kill한다.

```bash
opencode serve --port 14097 --hostname 127.0.0.1
```

**옵션:**
- `--port <n>`: 서버 포트 (기본값: 14097)
- `--hostname <host>`: 바인드 주소 (기본값: 127.0.0.1)
- `--mdns`: mDNS 브로드캐스트 활성화 (선택)
- `--cors`: CORS 허용 (선택)

**동작:**
- 시작 후 stdout에 ready 메시지 출력
- 플러그인 완전 로드 (oh-my-opencode 등)
- 세션 상태 영속 관리
- 프로세스가 살아있는 동안 계속 서비스

### opencode run --attach

기존 serve 프로세스에 연결하여 메시지를 전송한다.

```bash
opencode run \
  --attach http://127.0.0.1:14097 \
  --format json \
  --thinking \
  --session ses_xxx \
  --dir /path/to/workspace \
  "사용자 메시지"
```

**옵션:**
- `--attach <url>`: serve 프로세스 URL (필수)
- `--format json`: JSON 라인 출력 (필수)
- `--thinking`: reasoning 이벤트 별도 출력 (필수 — 이것 없으면 thinking이 strip됨)
- `--session <id>`: OpenCode 세션 ID (있으면 재사용, 없으면 새 세션)
- `--dir <path>`: 작업 디렉토리
- `--agent <name>`: 에이전트 지정 (선택)

### 실제 출력 예시 (검증 완료)

`opencode run --attach http://127.0.0.1:14097 --format json --thinking "안녕"` 실행 시:

```jsonl
{"type":"step_start","timestamp":...,"sessionID":"ses_xxx","part":{"type":"step-start"}}
{"type":"reasoning","timestamp":...,"part":{"type":"reasoning","text":"\nSimple question..."}}
{"type":"text","timestamp":...,"part":{"type":"text","text":"\n\n\nI'm Kiro..."}}
{"type":"step_finish","timestamp":...,"part":{"type":"step-finish","reason":"stop","cost":0,"tokens":{"total":37295,"input":37258,"output":37,"reasoning":0,"cache":{"read":0,"write":0}}}}
```

**핵심 차이점:**
- `--thinking` 사용 시 `{"type":"reasoning"}` 이벤트가 **별도 JSON 라인**으로 온다
- `<think>` 태그가 아님! 파서에서 `reasoning` 타입을 직접 처리해야 함
- `step_finish`에 `tokens` 객체가 포함됨 (토큰 사용량)

---

## 5. 구현 단계

### 단계 1: `serve-adapter.js` 신규 생성

`bridge/src/serve-adapter.js` 파일을 새로 만든다. 이것이 마이그레이션의 핵심이다.

#### 클래스 구조

```javascript
// bridge/src/serve-adapter.js
import { spawn } from 'node:child_process';
import { SessionStore } from './session-store.js';
import { createRuntimeParser } from './runtime-parser.js';

function now() {
  return new Date().toISOString();
}

function splitCommand(command) {
  if (!command.trim()) return [];
  return command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) ?? [];
}

export class ServeBackedOpenCodeAdapter {
  constructor(options = {}) {
    this.options = {
      command: options.command || process.env.OPENCODE_CMD || 'opencode',
      servePort: Number(options.servePort || process.env.OPENCODE_SERVE_PORT || 14097),
      serveHost: options.serveHost || process.env.OPENCODE_SERVE_HOST || '127.0.0.1',
    };
    this.store = new SessionStore();
    this.sessions = new Map();
    this.approvals = new Map();
    this.serveProc = null;
    this.serveReady = false;
    this.#hydrate();
  }
```

#### serve 프로세스 라이프사이클

```javascript
  // bridge 시작 시 호출
  async startServe() {
    if (this.serveProc) return;

    const args = ['serve', '--port', String(this.options.servePort), '--hostname', this.options.serveHost];
    this.serveProc = spawn(this.options.command, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      detached: process.platform !== 'win32',
    });

    // serve ready 감지: stdout에서 ready 시그널 대기
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('opencode serve startup timeout (30s)')), 30000);

      this.serveProc.stdout.setEncoding('utf8');
      this.serveProc.stderr.setEncoding('utf8');

      this.serveProc.stdout.on('data', (chunk) => {
        console.log(`[serve:stdout] ${chunk.trim()}`);
        // serve가 ready 상태가 되면 resolve
        // 정확한 ready 시그널은 실제 출력을 보고 조정할 것
        if (!this.serveReady && (chunk.includes('listening') || chunk.includes('ready') || chunk.includes('started'))) {
          this.serveReady = true;
          clearTimeout(timeout);
          resolve();
        }
      });

      this.serveProc.stderr.on('data', (chunk) => {
        console.error(`[serve:stderr] ${chunk.trim()}`);
      });

      this.serveProc.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      this.serveProc.once('exit', (code) => {
        this.serveProc = null;
        this.serveReady = false;
        if (!this.serveReady) {
          clearTimeout(timeout);
          reject(new Error(`opencode serve exited with code ${code}`));
        }
      });
    });
  }

  // bridge 종료 시 호출
  stopServe() {
    if (!this.serveProc) return;
    try {
      if (process.platform === 'win32') {
        this.serveProc.kill('SIGTERM');
      } else {
        process.kill(-this.serveProc.pid, 'SIGTERM');
      }
    } catch {
      try { this.serveProc.kill('SIGTERM'); } catch {}
    }
    this.serveProc = null;
    this.serveReady = false;
  }
```

#### 메시지 전송 (attach 방식)

기존 `ProcessBackedOpenCodeAdapter.pushUserMessage()`와 동일한 시그니처를 유지하되, spawn 명령만 다르다.

```javascript
  pushUserMessage(sessionId, text, handlers = {}) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    if (!this.serveReady) throw new Error('opencode serve is not running');

    // 파서 생성 — 기존과 동일
    entry.parser = createRuntimeParser({
      onApprovalRequested: (approval) => {
        this.approvals.set(approval.id, approval);
        handlers.onApprovalRequested?.(approval);
      },
      onApprovalResolved: (approval) => {
        this.approvals.set(approval.id, approval);
        handlers.onApprovalResolved?.(approval);
      },
      onTaskError: (sid, message) => handlers.onTaskError?.(sid, message),
      onAssistantText: (sid, chunk) => this.#appendAssistantText(sid, chunk, handlers),
      onAssistantBoundary: (sid) => this.#completeAssistantBoundary(sid, handlers),
      onRuntimeSession: (sid, runtimeSessionID) => this.#setRuntimeSessionID(sid, runtimeSessionID, handlers),
      onToolUse: (sid, toolUse) => this.#recordToolUse(sid, toolUse, handlers),
      onThinking: (sid, thinking) => handlers.onThinking?.(sid, thinking),
      onAgentDetected: (sid, agent) => this.#setAgent(sid, agent, handlers),
      onTokenUsage: (sid, tokens) => handlers.onTokenUsage?.(sid, tokens),
    });

    entry.cancelRequested = false;
    const effectiveText = this.#applyConsentContext(entry, text);
    entry.messages.push({ id: `msg_user_${Date.now()}`, role: 'user', text: effectiveText, createdAt: now() });
    entry.session.updatedAt = now();
    entry.session.status = 'running';
    entry.session.lastMessagePreview = effectiveText;
    this.#persist();
    handlers.onSessionUpdated?.(entry.session);

    const assistantId = `msg_assistant_${Date.now()}`;
    entry.currentAssistantId = assistantId;
    entry.messages.push({ id: assistantId, role: 'assistant', text: '', createdAt: now(), pending: true });

    // ★ 핵심 차이: --attach로 serve에 연결
    const argv = this.#buildAttachArgs(entry, effectiveText);
    const proc = spawn(this.options.command, argv, {
      cwd: entry.session.workspace,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
      detached: process.platform !== 'win32',
    });

    entry.proc = proc;

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => entry.parser?.parseChunk(entry.session.id, 'stdout', String(chunk)));
    proc.stderr.on('data', (chunk) => entry.parser?.parseChunk(entry.session.id, 'stderr', String(chunk)));
    proc.once('error', (error) => {
      entry.session.status = 'error';
      entry.session.updatedAt = now();
      this.#persist();
      handlers.onSessionUpdated?.(entry.session);
      handlers.onTaskError?.(entry.session.id, `Runtime process error: ${error.message}`);
    });
    proc.on('exit', (code, signal) => {
      entry.proc = null;
      const cancelled = entry.cancelRequested && (signal === 'SIGTERM' || signal === 'SIGINT');
      entry.session.status = cancelled || code === 0 || signal === 'SIGINT' ? 'idle' : 'error';
      entry.session.updatedAt = now();
      this.#persist();
      handlers.onSessionUpdated?.(entry.session);
      if (cancelled) {
        entry.cancelRequested = false;
        return;
      }
      if (code !== 0 && signal !== 'SIGINT') {
        handlers.onTaskError?.(entry.session.id, `Runtime exited with code ${code ?? 'unknown'} signal ${signal ?? 'none'}`);
      }
    });

    return assistantId;
  }
```

#### #buildAttachArgs 메서드

```javascript
  #buildAttachArgs(entry, text) {
    const attachUrl = `http://${this.options.serveHost}:${this.options.servePort}`;
    const args = ['run', '--attach', attachUrl, '--format', 'json', '--thinking'];

    if (entry.session.runtimeSessionID) {
      args.push('--session', entry.session.runtimeSessionID);
    }
    if (entry.session.workspace) {
      args.push('--dir', entry.session.workspace);
    }
    args.push(text);
    return args;
  }
```

#### 나머지 메서드 (기존 복사)

다음 메서드들은 **기존 `runtime-adapter.js`에서 그대로 복사**한다:

- `#hydrate()` — SessionStore에서 저장된 세션 복원
- `#persist()` — 세션 상태 저장
- `listSessions()` — 세션 목록 반환
- `createSession(workspace)` — 새 세션 생성
- `requireSession(sessionId)` — 세션 조회
- `getMessages(sessionId)` — 메시지 목록
- `listApprovals(sessionId)` — 대기 중 승인 목록
- `respondToApproval(approvalId, approved, handlers)` — 승인 응답
- `cancel(sessionId)` — 작업 취소
- `#applyConsentContext(entry, text)` — 승인 컨텍스트 적용
- `#setRuntimeSessionID(sessionId, runtimeSessionID, handlers)` — 런타임 세션 ID 설정
- `#recordToolUse(sessionId, toolUse, handlers)` — 도구 사용 기록
- `#setAgent(sessionId, agent, handlers)` — 에이전트 설정
- `#appendAssistantText(sessionId, text, handlers)` — 어시스턴트 텍스트 추가
- `#completeAssistantBoundary(sessionId, handlers)` — 어시스턴트 응답 완료

**중요**: 이 메서드들은 `runtime-adapter.js`의 `ProcessBackedOpenCodeAdapter`에서 1:1로 복사한다. 로직 변경 없음.

### 단계 2: `runtime-parser.js` 업데이트

`handleStructuredEvent()` 함수에 `reasoning` 이벤트 타입 처리를 추가한다.

#### 변경 1: `reasoning` 이벤트 처리 추가

`handleStructuredEvent()` 함수 내부, `payload.type === 'text'` 분기 **앞에** 다음을 추가:

```javascript
  // ★ 신규: reasoning 이벤트 (--thinking 플래그 사용 시)
  if (payload.type === 'reasoning' && payload.part?.text) {
    handlers.onThinking?.(sessionId, payload.part.text);
    return 'reasoning';
  }
```

#### 변경 2: `step_finish`에 토큰 사용량 전달

현재 `step_finish` 분기를 다음으로 변경:

```javascript
  // 변경 전:
  if (payload.type === 'step_finish') {
    handlers.onAssistantBoundary?.(sessionId);
    return 'boundary';
  }

  // 변경 후:
  if (payload.type === 'step_finish') {
    // ★ 신규: 토큰 사용량 전달
    if (payload.part?.tokens) {
      handlers.onTokenUsage?.(sessionId, payload.part.tokens);
    }
    handlers.onAssistantBoundary?.(sessionId);
    return 'boundary';
  }
```

`onTokenUsage` 핸들러는 optional chaining으로 호출하므로, 핸들러를 넘기지 않아도 에러가 나지 않는다.

### 단계 3: `adapter-factory.js` 업데이트

```javascript
// bridge/src/adapter-factory.js
import { InMemoryOpenCodeAdapter } from './stub-adapter.js';
import { ProcessBackedOpenCodeAdapter } from './runtime-adapter.js';
import { ServeBackedOpenCodeAdapter } from './serve-adapter.js';

export function createAdapter() {
  const mode = process.env.OPENCODE_BRIDGE_MODE || 'serve';  // ★ 기본값 변경: process -> serve
  if (mode === 'serve') {
    return new ServeBackedOpenCodeAdapter();
  }
  if (mode === 'process') {
    return new ProcessBackedOpenCodeAdapter();
  }
  return new InMemoryOpenCodeAdapter();
}
```

**주의**: 기본값을 `'serve'`로 변경한다. 기존 `'process'` 모드는 fallback으로 유지.

### 단계 4: `server.js` 업데이트

#### serve 라이프사이클 관리

`server.js` 상단, adapter 생성 후에 serve 프로세스를 시작한다.

```javascript
// server.js 상단 (adapter 생성 후)
const adapter = createAdapter();

// ★ 신규: serve 모드일 때 serve 프로세스 시작
if (adapter.startServe) {
  try {
    await adapter.startServe();
    console.log('[bridge] opencode serve started successfully');
  } catch (err) {
    console.error('[bridge] Failed to start opencode serve:', err.message);
    process.exit(1);
  }
}

// ★ 신규: 종료 시 serve 프로세스 정리
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`[bridge] Received ${signal}, shutting down...`);
    adapter.stopServe?.();
    process.exit(0);
  });
}
```

**주의**: `server.js`의 최상위 스코프가 현재 동기식이므로, top-level await를 사용해야 한다. `package.json`에 `"type": "module"`이 이미 설정되어 있으므로 top-level await가 가능하다.

#### `runtimeHandlers`에 `onTokenUsage` 추가

```javascript
const runtimeHandlers = {
  // ... 기존 핸들러 유지 ...
  onTokenUsage(sessionId, tokens) {
    broadcast({ jsonrpc: '2.0', method: 'session.tokenUsage', params: { sessionId, tokens } });
  },
};
```

### 단계 5: `.env.example` 업데이트

```env
# stub | process | serve
OPENCODE_BRIDGE_MODE=serve

# used when OPENCODE_BRIDGE_MODE=process (legacy)
OPENCODE_CMD=opencode
OPENCODE_ARGS=
OPENCODE_SESSION_ARGS=

# used when OPENCODE_BRIDGE_MODE=serve
OPENCODE_SERVE_PORT=14097
OPENCODE_SERVE_HOST=127.0.0.1

PORT=7345
```

### 단계 6: App 측 변경 (선택)

토큰 사용량 표시를 위한 최소 변경. 이 단계는 bridge 마이그레이션 완료 후 진행해도 된다.

#### `app/src/types.ts`

```typescript
export interface TokenUsage {
  total: number;
  input: number;
  output: number;
  reasoning: number;
  cache: { read: number; write: number };
}
```

#### `app/App.tsx`

`session.tokenUsage` 이벤트 핸들러 추가 (useEffect 내 WebSocket 이벤트 핸들러에):

```typescript
case 'session.tokenUsage': {
  const { sessionId, tokens } = params;
  // 상태에 저장하거나 UI에 표시
  console.log(`[tokens] session=${sessionId}`, tokens);
  break;
}
```

---

## 6. 파일별 변경 명세

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `bridge/src/serve-adapter.js` | **신규** | `ServeBackedOpenCodeAdapter` 클래스. `runtime-adapter.js`를 복사하고 serve 라이프사이클 + attach 명령 추가 |
| `bridge/src/adapter-factory.js` | **수정** | `ServeBackedOpenCodeAdapter` import 추가, 기본값 `'serve'`로 변경, `mode === 'serve'` 분기 추가 |
| `bridge/src/runtime-parser.js` | **수정** | `reasoning` 이벤트 타입 처리 추가, `step_finish`에 `onTokenUsage` 호출 추가 |
| `bridge/src/server.js` | **수정** | serve 라이프사이클 관리 (startServe/stopServe), `onTokenUsage` 핸들러 추가 |
| `bridge/.env.example` | **수정** | `OPENCODE_SERVE_PORT`, `OPENCODE_SERVE_HOST` 추가, 기본값 `serve`로 변경 |
| `bridge/src/runtime-adapter.js` | **변경 없음** | 기존 코드 그대로 유지 (fallback) |
| `app/src/types.ts` | **수정** (선택) | `TokenUsage` 인터페이스 추가 |
| `app/App.tsx` | **수정** (선택) | `session.tokenUsage` 이벤트 핸들러 추가 |

---

## 7. 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OPENCODE_BRIDGE_MODE` | `serve` | 어댑터 모드: `stub`, `process`, `serve` |
| `OPENCODE_CMD` | `opencode` | OpenCode CLI 경로 |
| `OPENCODE_SERVE_PORT` | `14097` | serve 프로세스 포트 |
| `OPENCODE_SERVE_HOST` | `127.0.0.1` | serve 프로세스 바인드 주소 |
| `OPENCODE_ARGS` | (empty) | process 모드용 추가 인자 (legacy) |
| `OPENCODE_SESSION_ARGS` | (empty) | process 모드용 세션 인자 (legacy) |
| `PORT` | `7345` | bridge WebSocket 서버 포트 |

---

## 8. 검증 체크리스트

### 사전 조건

- [ ] `opencode serve --port 14097` 실행 확인 (호스트 머신에서 직접 테스트)
- [ ] `opencode run --attach http://127.0.0.1:14097 --format json --thinking "테스트"` 실행 확인
- [ ] 위 명령의 stdout에서 `reasoning`, `text`, `step_finish` JSON 라인 확인

### 빌드 검증

- [ ] `npm run gate` 전체 통과 (app + bridge)
- [ ] bridge 단독 테스트: `npm test --prefix bridge`
- [ ] ESLint 에러 없음

### 기능 검증

- [ ] bridge 시작 시 `opencode serve` 프로세스가 자동 spawn되는지 확인
- [ ] bridge 로그에 `[bridge] opencode serve started successfully` 출력 확인
- [ ] 모바일 앱에서 메시지 전송 -> 응답 수신 확인
- [ ] Think 블록이 모바일 앱에 표시되는지 확인 (보라색 접이식 블록)
- [ ] 도구 호출 카드가 표시되는지 확인
- [ ] 에이전트 이름이 상단 상태바에 표시되는지 확인
- [ ] 세션 생성/재개 가 정상 동작하는지 확인
- [ ] 작업 취소가 정상 동작하는지 확인
- [ ] bridge 종료 시 `opencode serve` 프로세스가 함께 종료되는지 확인 (Ctrl+C)

### 회귀 검증

- [ ] `OPENCODE_BRIDGE_MODE=process`로 설정 시 기존 동작 유지 확인
- [ ] `OPENCODE_BRIDGE_MODE=stub`으로 설정 시 stub 모드 정상 동작 확인

---

## 9. 롤백 계획

문제 발생 시 즉시 롤백할 수 있도록 다음을 준비한다.

### 즉시 롤백

`adapter-factory.js`의 기본값을 `'process'`로 되돌리면 기존 동작으로 복귀된다:

```javascript
// 롤백: 기본값을 process로 변경
const mode = process.env.OPENCODE_BRIDGE_MODE || 'process';
```

또는 `.env` 파일에서:

```env
OPENCODE_BRIDGE_MODE=process
```

### 영향 범위

- `serve-adapter.js`는 신규 파일이므로 기존 코드에 영향 없음
- `adapter-factory.js` 변경은 import 추가 + 기본값 변경만으로 최소
- `runtime-parser.js` 변경은 새 이벤트 타입 추가만으로 기존 동작에 영향 없음
- `server.js` 변경은 `adapter.startServe` 존재 여부로 분기하므로 process/stub 모드에 영향 없음

### 위험 요소

1. **serve ready 감지**: `opencode serve`의 stdout ready 메시지 형식이 버전마다 다를 수 있음 -> 실제 출력을 보고 `startServe()`의 ready 감지 조건 조정
2. **포트 충돌**: 14097 포트가 이미 사용 중일 수 있음 -> `OPENCODE_SERVE_PORT` 환경변수로 조정
3. **프로세스 종료 실패**: Windows에서 `SIGTERM`이 제대로 동작하지 않을 수 있음 -> `taskkill` fallback 고려

---

## 부록: 주요 참조 파일 위치

```
opencode-mobile/
  bridge/
    src/
      adapter-factory.js    <- 어댑터 선택 (수정)
      runtime-adapter.js    <- 기존 ProcessBacked (복사 원본, 변경 없음)
      runtime-parser.js     <- 파서 (수정)
      serve-adapter.js      <- 신규 ServeBacked
      server.js             <- WebSocket 서버 (수정)
      session-store.js      <- 세션 저장소 (변경 없음)
      stub-adapter.js       <- stub 모드 (변경 없음)
    .env.example            <- 환경변수 예시 (수정)
  app/
    src/
      types.ts              <- 타입 정의 (선택 수정)
    App.tsx                 <- 앱 중앙 상태 (선택 수정)
```