# 02. 시스템 아키텍처

## 1) 구성 모듈
1. Market Data Adapter
2. Signal Engine
3. Risk Engine
4. Execution Engine
5. Journal & Analytics
6. SOP Scheduler
7. Config/Policy Store

## 2) 데이터 흐름
1. 시세 수신 → 2) 신호 계산 → 3) 리스크 한도 검증 → 4) 주문 실행 → 5) 체결 반영 → 6) 저널/리포트

## 3) 모듈 책임
- Signal Engine: 전략 규칙 계산(예: 돌파, MA, ATR)
- Risk Engine: 1회/일간/주간 손실 검증, 포지션 사이즈 산정
- Execution Engine: 주문 생성/수정/취소, 실패 재시도
- Journal & Analytics: 거래 근거·위반·성과 지표 저장
- SOP Scheduler: 프리마켓/장중/마감/주간/월간 작업 자동 트리거

## 4) 권장 기술 스택(예시)
- 백엔드: Python (FastAPI), Pandas, Backtrader/VectorBT
- DB: PostgreSQL (거래/저널), Redis (실시간 상태)
- 스케줄러: cron / APScheduler
- 시각화: Metabase/Grafana

## 5) 안정성 설계
- 주문 멱등키(idempotency key) 사용
- 거래소 API 실패 시 exponential backoff
- 비상 정지(Kill Switch): 수동/자동 둘 다 제공
