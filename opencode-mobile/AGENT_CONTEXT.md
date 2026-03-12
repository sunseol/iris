# AGENT_CONTEXT.md

## 프로젝트 정체성
- `opencode-mobile`은 **generic chat app이 아니라 OpenCode mobile client**다.
- 제품 핵심은 **project-first, thread-centric workspace**다.
- 기본 흐름은 `project -> threads/sessions -> runtime -> approval/composer`다.
- OpenAI는 provider option 중 하나일 뿐, 제품 정체성이 아니다.

## 제품 목표
- 휴대폰에서 OpenCode host/bridge에 연결한다.
- 프로젝트 안에서 스레드/세션을 만들고 전환한다.
- runtime state, model/auth, connection, composer를 workspace 안에서 유지한다.
- 수동 입력보다 **QR + recent hosts + reconnect** 중심으로 연결 UX를 만든다.

## 절대 금지사항
- OpenAI-first 앱처럼 해석/구현하지 말 것
- generic chat UI/구조로 드리프트하지 말 것
- project-first / thread-centric 구조를 무너뜨리지 말 것
- pairing / reconnect 경로를 제거하지 말 것
- 수동 endpoint 입력을 메인 UX로 올리지 말 것
- UI 리디자인/Irisfront 리스킨 작업으로 새지 말 것

## 현재 기본 연결 UX
1. **Scan QR**
2. **Recent hosts**
3. **Reconnect**
4. manual endpoint input = fallback only

## 현재 구현 완료 상태
- Android AVD에서 `ws://10.0.2.2:7345`로 OpenCode bridge native 연결 성공 검증 완료
- `ws://192.168.0.10:7345`는 stale endpoint 또는 LAN routing issue로 판정
- QR + tunnel 기반 pairing flow 1차 구현 완료
- QR payload v2 hardening 1차 구현 완료
  - `pairingToken`
  - `expiresAt`
  - `hostId`
  - `version`
  - `projectHint`
- mobile에서 `QR 스캔 -> payload 검증 -> endpoint 저장 -> 즉시 connect` 가능
- trusted hosts / recent reconnect 1차 구현 완료
- app lint/test 통과
- bridge lint/test 통과

## 검증 endpoint 규칙
- 올바른 AVD 검증 endpoint: `ws://10.0.2.2:7345`
- stale/LAN 문제 endpoint: `ws://192.168.0.10:7345`
- 외부 기기/원격 연결은 tunnel 기반 `wss://...` 사용

## 현재 우선순위
1. pairing productionization
2. tunnel provider abstraction (`localtunnel -> ngrok/cloudflared` 고려)
3. reconnect resilience / trusted host management 강화

## 반드시 유지해야 할 기능
- project-first 구조
- multiple thread/session 구조
- current project 표시
- active thread 표시/전환
- runtime state 가시성
- model/auth/connection 진입점
- composer 접근성
- approval actions
- QR pairing
- recent hosts / reconnect
- manual endpoint input fallback 경로
