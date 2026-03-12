# CHANGELOG_AGENT.md

## 현재 프로젝트 상태 요약
- `opencode-mobile`은 OpenCode mobile client다.
- generic chat app으로 해석하면 안 된다.
- 핵심 구조는 project-first, thread-centric workspace다.
- 현재 연결 UX의 중심은 QR pairing / recent hosts / reconnect다.
- manual endpoint 입력은 fallback only다.

## 이미 완료된 pairing 기능
- QR + tunnel 기반 pairing flow 1차 구현 완료
- QR payload v2 hardening 1차 구현 완료
  - `pairingToken`
  - `expiresAt`
  - `hostId`
  - `version`
  - `projectHint`
- mobile에서 QR 스캔 -> payload 검증 -> endpoint 저장 -> 즉시 connect 가능
- trusted hosts / recent reconnect 1차 구현 완료
- Android AVD에서 `ws://10.0.2.2:7345` OpenCode bridge native 연결 성공 검증 완료
- `ws://192.168.0.10:7345`는 stale endpoint 또는 LAN routing issue로 판정
- app lint/test 통과
- bridge lint/test 통과

## 아직 남은 작업
- pairing productionization
- trusted hosts remove/revoke/reset UX
- websocket close reason 구조화
- tunnel provider abstraction
- reconnect resilience 강화
- expired tunnel / expired QR 운영 UX 강화

## 다음 세션 시작 시 반드시 읽을 포인트
- `AGENT_CONTEXT.md`
- `CURRENT_TASK.md`
- `plans/pairing-productionization.md`

## 다음 세션에서 드리프트하면 안 되는 것
- UI 리디자인 금지
- Irisfront 리스킨 재시도 금지
- OpenAI-first 해석 금지
- generic chat app처럼 바꾸지 말 것
- manual endpoint를 메인 UX로 다루지 말 것
- pairing / reconnect 경로 제거 금지

## 검증 시 기억할 것
- AVD 기본 검증 endpoint: `ws://10.0.2.2:7345`
- stale/LAN 문제 endpoint: `ws://192.168.0.10:7345`
- 외부 기기 검증은 tunnel 기반 `wss://...` 우선
