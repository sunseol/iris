# OpenCode Mobile Beta Handoff

## 목적
이 문서는 외부 테스터가 `opencode-mobile` 앱을 설치하고, 실제 bridge/process runtime 기준으로 무엇을 검증할 수 있는지와 무엇이 아직 제한되는지를 빠르게 이해하도록 만든 베타 가이드다.

---

## 현재 베타 판정 요약

### 테스트 가능 범위
외부 테스터는 현재 아래를 실제로 검증할 수 있다.
- 앱 설치 및 실행
- bridge endpoint 입력 및 연결
- project 생성 / 전환
- thread(session) 생성 / 전환
- message send
- assistant response 표시 및 저장
- session/thread resume
- real process mode에서 tool-use가 포함된 흐름 확인
- cancel 요청 및 UI 상태 반영 확인
- reconnect / disconnected / bridge restart 이후 resume UX 확인

### 현재 제한 범위
- **approval required 경로의 완전한 E2E는 아직 환경 의존 블로커가 남아 있음**
- approval UI/bridge consent state는 앱 안에 존재하지만, 현재 테스트 환경에서 **OpenCode CLI가 native approval prompt를 일관되게 발생시키지 않음**

---

## 가장 중요한 beta blocker

### Blocker: real approval E2E is not yet reliable

#### 현재 관찰된 상태
- real runtime 기준으로 `create / send / resume / tool-use`는 확인됨
- `opencode run --format json` 자체는 동작함
- process mode bridge도 실제 OpenCode CLI를 spawn 가능함
- 하지만 approval required 경로는 현재 테스트 환경에서 일관되게 재현되지 않음

#### 원인 후보
1. **CLI approval policy / exec policy 환경 차이**
   - 현재 환경에서는 단순 bash/tool use 요청이 자동 승인되거나 직접 실행되어,
     bridge parser가 기대하는 approval-style assistant text가 나오지 않을 수 있음
2. **bridge-side approval model과 native CLI approval model의 차이**
   - 현재 앱/bridge approval은 일부가 bridge-side consent semantics에 의존함
   - `PRODUCTION_CHECKLIST.md`에도 native structured OpenCode approval API는 아직 미확인으로 남아 있음
3. **process mode prompt characteristics**
   - 어떤 프롬프트는 tool-use는 발생하지만 approval text는 발생하지 않음
   - 즉, approval parser/UX는 있어도 CLI가 그 상황을 매번 approval flow로 노출하지 않음
4. **host runtime policy / allowlist / sandbox config 차이 가능성**
   - 테스터 환경에 따라 `opencode` 실행 정책, 허용 명령, worktree 권한, approval 설정이 다를 수 있음

#### 외부 재현/확인 시 필요한 것
- `opencode` binary path 확인: `which opencode`
- CLI 단독 확인: `opencode run --format json 'Say hello in one short sentence.'`
- tool-use 확인: `opencode run --format json 'Run pwd and tell me the result.'`
- bridge process mode 환경값 확인:
  - `OPENCODE_BRIDGE_MODE=process`
  - `OPENCODE_CMD=opencode`
  - `OPENCODE_ARGS='run --format json'`
  - `OPENCODE_BRIDGE_STATE_PATH`
- approval policy 관련 host 설정/allowlist/sandbox 정책 확인

#### 현재 결론
- approval path는 **미구현이 아니라, 환경 의존 블로커로 인해 베타에서 “제한 기능”으로 분류**한다.
- 외부 테스터에게는 **approval required 경로가 현재 제한될 수 있음**을 명시해야 한다.

---

## 설치 / 실행 방법

## Android 앱
### 개발 빌드 / 로컬 실행
```bash
cd opencode-mobile/app
npm install
npm run start
```
- Expo Dev Client 또는 Android emulator/device에서 실행

### Android 산출물 준비
베타 배포용으로는 아래 둘 중 하나를 권장한다.
1. **EAS build**로 APK/AAB 생성
2. 내부 테스트용 debug APK 생성

예시(환경에 맞게 조정):
```bash
cd opencode-mobile/app
npx expo install
npx eas build -p android --profile preview
```

> 실제 배포 방식은 팀의 Expo/EAS 설정에 따라 달라질 수 있다. 베타 배포 전에는 반드시 설치 가능한 Android artifact를 한 번 직접 받아 설치 검증할 것.

---

## Bridge 실행 방법

### Stub mode
```bash
cd opencode-mobile/bridge
npm install
npm start
```
기본은 stub mode일 수 있다.

### Real process mode
```bash
cd opencode-mobile/bridge
PORT=7345 \
OPENCODE_BRIDGE_MODE=process \
OPENCODE_CMD=opencode \
OPENCODE_ARGS='run --format json' \
OPENCODE_BRIDGE_STATE_PATH=$PWD/data/sessions.json \
node src/server.js
```

### 권장 사전 확인
```bash
which opencode
opencode run --format json 'Say hello in one short sentence.'
opencode run --format json 'Run pwd and tell me the result.'
```

---

## 외부 테스터 onboarding

### 첫 실행 시 해야 할 일
1. 앱 실행
2. `Connection` 화면으로 이동
3. bridge endpoint 입력 (`ws://HOST:PORT`)
4. `Connect` 누르기
5. `Projects`에서 project 선택/생성
6. workspace에서 thread(sheet) 열기
7. 새 thread 생성 또는 기존 thread 선택
8. 하단 command bar에서 prompt 전송

### model/auth는 어디서 확인하나?
- `Models & Auth` 화면
- 현재 project에 연결된 model / auth profile 확인 가능

### project/thread는 어떻게 만들고 전환하나?
- project: `Projects` 화면
- thread: workspace 상단의 `Threads` 버튼 → bottom sheet navigator

### approval/cancel은 어디서 처리하나?
- approval: workspace의 approval action 영역
- cancel: command bar / thread quick action / active thread 컨텍스트에서 처리

### 에러가 나면 어디를 봐야 하나?
- `Connection` 화면의:
  - Diagnostics
  - Recent events
  - Host status
- workspace의:
  - runtime state card
  - active thread summary

---

## 현재 테스트 가능한 핵심 시나리오

### 시나리오 A: hello path
1. endpoint 입력 후 connect
2. project 선택
3. thread 생성
4. `Say hello in one short sentence.` 전송
5. assistant 응답 표시 확인
6. 앱 재진입 또는 thread 전환 후 resume 확인

### 시나리오 B: tool-use path
1. real process mode bridge 사용
2. `Run pwd and tell me the result.` 전송
3. runtime panel / transcript / persisted result 확인
4. resume 후 메시지/history 유지 확인

### 시나리오 C: recovery path
1. thread 생성 후 메시지 전송
2. bridge 재시작 또는 연결 끊김 발생
3. reconnect
4. `session.list` / UI resume 경로로 thread 복원 확인

### 시나리오 D: cancel path
1. 긴 task 또는 실행 중 상태 진입
2. cancel 요청
3. runtime state / thread badge / recent events 반영 확인

---

## recovery 시나리오 정리

### 1. unreachable bridge
- 현재 동작: connect 실패
- 사용자 UI: Connection 화면에서 실패 상태 / diagnostics / retry
- 보고 시 필요한 정보:
  - endpoint
  - connection state
  - last error
  - host status(가능 시)

### 2. connection timeout
- 현재 동작: timeout 후 disconnected 유지
- 사용자 UI: connect 실패 메시지, retry 가능
- 보고 시 필요한 정보:
  - endpoint
  - last error
  - recent events

### 3. reconnect after socket close
- 현재 동작: disconnected 상태 노출 후 reconnect 가능
- 사용자 UI: runtime/disconnected 표시, Connection 화면에서 retry
- 보고 시 필요한 정보:
  - active project
  - active thread id
  - connection state
  - recent events

### 4. bridge restart during active session
- 현재 동작: bridge state path가 유지되면 session.list / session.resume로 복원 가능
- 사용자 UI: reconnect 이후 thread 재선택/재개 필요 가능성 있음
- 보고 시 필요한 정보:
  - bridge state path 사용 여부
  - active thread id
  - restart 전/후 recent events

### 5. app relaunch 후 상태 복원
- 현재 동작: active project / active session mapping은 persistence 경로가 있음
- 사용자 UI: project-scoped active thread 복원 시도
- 보고 시 필요한 정보:
  - active project
  - active thread id
  - restore 실패 여부

### 6. cancel 이후 상태 반영
- 현재 동작: session status와 runtime 표시가 `cancelled` semantics를 사용
- 사용자 UI: runtime card / thread rail / workspace에 취소 상태 반영
- 보고 시 필요한 정보:
  - active thread id
  - last error
  - recent events(`task.cancel` 포함)

---

## 앱 내부에서 확인할 진단 정보
테스터는 `Connection` 화면에서 아래 정보를 확인할 수 있어야 한다.
- active project
- active thread/session id
- bridge endpoint
- connection state
- active model
- runtime status
- last error
- approval pending 여부
- recent events(create/send/resume/cancel/disconnect 등)

---

## known issues
1. real approval flow는 현재 환경 의존 블로커가 있어 완전 E2E 보장 불가
2. reconnect / auto-resume는 베타 수준이며 더 많은 실기기 검증 필요
3. 일부 process-mode 테스트는 host의 OpenCode CLI 설정/권한 정책에 따라 결과가 달라질 수 있음
4. diff review는 현재 UI 구조는 존재하지만, fully structured backend diff persistence는 추가 고도화 여지 있음

---

## 문제 보고 템플릿
아래 형식으로 보내면 triage가 빠르다.

```md
## Device
- Android model:
- OS version:
- App build:

## Environment
- Bridge endpoint:
- Bridge mode: stub / process
- `which opencode` 결과:
- `opencode run --format json 'Say hello...'` 결과: success / fail

## Scenario
- 수행한 작업:
- 기대한 결과:
- 실제 결과:

## Diagnostics from app
- Active project:
- Active thread id:
- Connection state:
- Active model:
- Runtime status:
- Last error:
- Approval pending:
- Recent events:

## Extra logs
- bridge logs:
- screenshots/screen recording:
```

---

## 베타 리스크 요약
- 핵심 runtime create/send/resume/tool-use 경로는 실사용 가능 수준
- approval 경로는 여전히 제한적이며, 현재는 베타 문서에 명시된 known issue로 관리
- 외부 테스터는 현재부터 설치/연결/기본 작업/복구 시나리오 테스트 가능
