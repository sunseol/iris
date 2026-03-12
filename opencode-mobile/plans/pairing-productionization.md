# pairing-productionization.md

## 문제 정의
현재 `opencode-mobile`은 QR + tunnel 기반 pairing 1차 구현까지는 완료됐다.
하지만 production 관점에서는 아직 아래가 더 필요하다.
- trusted hosts의 lifecycle 관리 부족
- revoke/remove/reset UX 부재
- websocket close reason 구조화 부족
- tunnel provider 종속성(localtunnel) 완화 필요
- reconnect 실패 원인 분류/복구 전략 강화 필요

이 작업은 connection settings 일반화가 아니라, **OpenCode bridge pairing flow를 운영 가능한 수준으로 강화하는 것**이다.

---

## 목표 사용자 플로우
1. 데스크톱에서 OpenCode bridge 실행
2. bridge를 public tunnel로 노출
3. QR payload 생성 및 표시
4. 모바일 앱에서 `QR 스캔`
5. payload 검증
6. endpoint / token / host metadata 저장
7. 즉시 connect 시도
8. 성공 시 trusted host 등록
9. 이후에는 `Recent hosts / Reconnect`로 재진입
10. 만료/불일치/오프라인이면 구체적인 오류와 복구 선택지 제공

---

## 세부 작업 항목

### 1) payload / pairing 검증 강화
- `type` 검증
- `version` 검증
- `expiresAt` 검증
- endpoint 프로토콜 검증 (`ws://`, `wss://`)
- `hostId`/`pairingToken` mismatch 시 명확한 거부

### 2) bridge-side pairing enforcement 강화
- 현재 1개 pairing-store 기반 검증에서 확장 가능성 마련
- multi-token / rotate-token 고려
- close code + close reason 구조화
- 모바일에서 reason을 해석 가능하게 유지

### 3) trusted hosts 관리
- recent hosts 저장
- trusted host 재접속
- stale host 표시
- expired host 표시
- remove/revoke/reset UI 추가 필요

### 4) reconnect resilience
- 최근 성공 endpoint/token 재사용
- 실패 시 fallback 안내
- tunnel unreachable / bridge offline / token mismatch / expired QR 분리
- bridge restart 후 reconnect 재시도 UX 정리

### 5) tunnel provider abstraction
- 현재 `localtunnel` 직접 의존
- provider interface로 분리 필요
- 후보:
  - localtunnel
  - ngrok
  - cloudflared

### 6) ops/운영성
- pairing artifact 정리 규칙
- generated file(.html/.json) 유지 정책
- token 만료 기본값/갱신 정책
- trusted host 정리 정책

---

## mobile 변경 파일 후보
- `app/App.tsx`
- `app/src/pairing.ts`
- `app/src/qr-placeholder.ts`
- `app/src/storage.ts`
- `app/src/screens/ConnectionScreen.tsx`
- `app/src/rpc.ts`
- `app/tests/pairing.test.ts`
- `app/tests/utils.test.ts`

## bridge / desktop 변경 파일 후보
- `bridge/src/server.js`
- `bridge/src/pairing.js`
- `bridge/src/pairing-cli.js`
- `bridge/src/pairing-store.js`
- `bridge/src/host-info.js`
- `bridge/src/session-store.js` (필요 시)
- `bridge/package.json`
- `bridge/tests/pairing-store.test.js`
- `bridge/README.md`

---

## trusted hosts 관리 방향
- 저장 단위:
  - `hostId`
  - `label`
  - `endpoint`
  - `pairingToken`(있으면)
  - `expiresAt`
  - `version`
  - `lastConnectedAt`
- 기본 정책:
  - 최근 연결 우선 정렬
  - 중복 hostId는 merge/update
  - 최대 개수 제한 필요(예: 8~10)
- 이후 추가할 것:
  - host 제거
  - 전체 초기화
  - 신뢰 해제(revoke)

---

## revoke / remove / reset UI 필요사항
- Recent hosts 각 항목에 제거 액션
- 만료된 host는 badge 표시
- 전체 trusted host reset 액션
- token mismatch가 반복되면 해당 host 재스캔 유도
- bridge-side revoke가 생기면 앱에서 stale/revoked 표시 필요

---

## reconnect resilience 전략
- reconnect는 수동 endpoint 재입력보다 recent host 우선
- endpoint/token/hostId/version을 함께 재구성
- 실패 분류:
  - expired QR
  - invalid payload
  - tunnel unreachable
  - bridge offline
  - auth/token mismatch
- bridge restart 시:
  - host는 trusted host로 유지
  - bridge offline -> reconnect path 제시
- tunnel 만료 시:
  - host는 남기되 `재스캔 필요` 표시

---

## websocket close reason 구조화 방향
현재는 문자열 기반 reason 해석이 섞여 있다.
다음 단계에서 목표:
- bridge close code 규약화
- close reason enum화
- 모바일에서 매핑 테이블로 해석

예시:
- `4001` pairing rejected
- `4002` expired token
- `4003` host mismatch
- `4004` unsupported version
- `4500` bridge internal error

---

## expired tunnel / expired QR 처리 전략

### expired QR
- payload의 `expiresAt`으로 사전 차단
- 스캔 직후 거부
- 안내: 새 QR 생성 필요

### expired tunnel
- 연결 timeout / websocket failure로 탐지
- 기존 trusted host는 유지
- 상태: `재스캔 필요` 또는 `터널 만료 가능성`
- 안내: 데스크톱에서 새 tunnel/QR 생성

---

## provider abstraction 시 고려사항

### localtunnel
- 장점: 빠르게 붙이기 쉬움
- 단점: 안정성/지속성 한계, 도메인 정책 불안정 가능성

### ngrok
- 장점: 안정성/운영성 좋음, websocket 친화적
- 단점: 계정/토큰/요금/설정 관리 필요

### cloudflared
- 장점: 터널 운영 경험 좋고 장기적으로 유리할 수 있음
- 단점: 초기 설정/운영 복잡도 증가 가능

### abstraction 방향
- `createPublicTunnel()` 인터페이스 도입
- 반환값 공통화:
  - `publicUrl`
  - `wsEndpoint`
  - `provider`
  - `close()`
- CLI/QR 생성 로직은 provider 독립적으로 유지

---

## 단계별 구현 순서
1. pairing payload / trusted hosts 현 상태 문서화
2. close reason 구조화
3. trusted host remove/reset UI 추가
4. stale/expired badge 및 재스캔 유도 UX 추가
5. tunnel provider abstraction 레이어 도입
6. localtunnel 구현체 이관
7. ngrok/cloudflared 후보 검증
8. 실기기 장시간 reconnect/expiry 테스트

---

## 테스트 시나리오
- valid QR 스캔 후 즉시 연결 성공
- expired QR 스캔 즉시 거부
- invalid payload 거부
- unsupported version 거부
- host mismatch 거부
- token mismatch 거부
- recent host 재접속 성공
- 만료된 recent host 재접속 실패 + 적절한 안내
- tunnel 만료 후 재접속 실패 + 재스캔 유도
- bridge offline 상태에서 reconnect 실패 분류 확인
- AVD에서 `ws://10.0.2.2:7345` native 검증 유지
- 외부 기기에서 `wss://...` tunnel 검증

---

## 남은 리스크
- localtunnel의 장시간 운영 안정성
- 토큰 회전/다중 토큰 지원 부재
- generated artifact 파일 관리 정책 미정
- trusted hosts가 많아질 때 UX 복잡도 증가
- bridge-side close reason이 충분히 안정화되지 않으면 모바일 에러 분류가 흔들릴 수 있음

---

## 이 계획에서 하지 않을 것
- UI 리디자인
- generic chat UX 개편
- project/thread 구조 변경
- manual endpoint를 주 연결 방식으로 승격
- pairing 기능 축소/제거
