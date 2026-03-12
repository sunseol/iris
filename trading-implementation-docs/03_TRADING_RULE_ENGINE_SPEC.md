# 03. 트레이딩 룰 엔진 명세

## 1) 전략 DSL(간단 스키마)
```yaml
strategy_id: trend_breakout_v1
timeframe: 1D
entry:
  - type: breakout
    lookback: 20
exit:
  - type: stop_loss
    mode: atr
    atr_mult: 2
  - type: trailing_stop
    atr_mult: 3
position_sizing:
  mode: fixed_risk_pct
  risk_pct: 0.5
filters:
  - type: regime
    allow: [trend]
```

## 2) 진입 조건
- C-01: 레짐 필터 통과(추세/횡보/고변동)
- C-02: 신호 충족(예: n일 고점 돌파)
- C-03: 최소 손익비(R:R >= 1:2)

## 3) 리스크 게이트
- G-01: 단일 거래 리스크 <= 정책값
- G-02: 일간 손실 한도 미도달
- G-03: 주간 손실 한도 미도달
- G-04: 동시 보유 총위험 <= 정책값

## 4) 포지션 사이징
- 고정 % 리스크: `수량 = 허용손실금액 / (진입가-손절가)`
- ATR 기반: 변동성 증가 시 자동 사이즈 축소

## 5) 위반 처리
- 규칙 위반 주문 차단 + 로그 기록
- 같은 날 위반 1회 이상 시 자동 사이즈 50% 축소(옵션)
