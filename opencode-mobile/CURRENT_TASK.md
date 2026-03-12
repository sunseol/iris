# CURRENT_TASK.md

## 이번 세션 목표
**pairing productionization**

QR + tunnel 기반 OpenCode bridge pairing을
- 더 안전하게
- 더 복구 가능하게
- 더 운영 가능하게
만든다.

## In scope
- pairing payload 검증 강화
- bridge-side pairing token / expiry 검증 강화
- trusted hosts 관리 강화
- recent reconnect UX 강화
- reconnect resilience 개선
- websocket close reason 구조화
- expired QR / expired tunnel / invalid payload 처리 강화
- tunnel provider abstraction 설계 및 구현 준비
- pairing 관련 문서/테스트 강화

## Out of scope
- UI 리디자인
- Irisfront 리스킨 재시도
- generic chat UX 개선
- project/thread 구조 변경
- OpenAI 전용 기능 추가
- manual endpoint input을 메인 UX로 승격
- pairing과 무관한 대규모 리팩터링

## 유지해야 하는 기존 기능
- OpenCode bridge 연결 흐름
- project-first, thread-centric workspace
- runtime / transcript / diff / context 존재
- model/auth / connection 진입점
- composer 접근성
- approval 흐름
- QR 스캔 -> endpoint 저장 -> 즉시 connect
- recent hosts / reconnect
- manual endpoint 입력 fallback

## 완료 조건
- 오래된/잘못된 QR이 거부될 것
- valid QR은 계속 연결 가능할 것
- trusted hosts에서 재접속 가능할 것
- reconnect 실패 원인이 더 구체적으로 분리될 것
- tunnel provider를 교체 가능한 구조로 정리할 것
- lint/test 통과할 것

## 테스트 / 검증 항목
- valid QR 성공
- expired QR 실패
- invalid payload 실패
- token mismatch 실패
- recent host 재접속 성공
- AVD 기준 `10.0.2.2` 연결 경로 유지
- tunnel 기반 `wss://...` 연결 경로 유지

## 예상 리스크
- tunnel provider별 websocket/수명/도메인 정책 차이
- 오래된 trusted host 누적으로 인한 UX 혼선
- bridge close reason이 부족하면 모바일 에러 분리가 애매할 수 있음
- reconnect 과정에서 endpoint/token/expiry의 우선순위 충돌 가능성

## 하지 말아야 할 것
- pairing 작업 중 UI 리디자인으로 새지 말 것
- 이미 구현된 pairing/reconnect 경로를 제거하지 말 것
- generic connection settings 문제로 축소하지 말 것
- 수동 endpoint 입력을 주 연결 UX처럼 다루지 말 것
