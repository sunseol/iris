# BTC KRW-BTC Overnight Simulation Report

- 데이터: 업비트 60분봉 최근 4000개
- 기간: 2025-09-08 05:00:00+00:00 ~ 2026-02-22 23:00:00+00:00
- 분할: 인샘플 70%(2800 bars) / 아웃샘플 30%(1200 bars)
- 기준 전략: 20돌파 + ATR(14,2.0), 리스크 0.5%

## 실험 설정
- breakout lookback: [10, 20, 30, 55]
- ATR period: [10, 14, 20]
- ATR mult: [1.5, 2.0, 2.5, 3.0]
- risk per trade: [0.25%, 0.5%]
- trend filter: none / MA100 상방
- regime filter: none / ADX14 >= 20
- 총 조합 수: 384

## 기준 전략 성능 (20돌파 + ATR2, risk 0.5%)
- IS: 수익률 -15.16%, MDD -15.54%, 거래 64, 승률 20.31%, PF 0.27, 평균R -0.492
- OOS: 수익률 -6.86%, MDD -7.23%, 거래 27, 승률 11.11%, PF 0.15, 평균R -0.553

## 상위 5개 조합 (IS/OOS 균형 랭킹)

### 1) lb55_atr10_m2.5_r0.0025_tfnone_rfadx20
- 파라미터: lb=55, atr_p=10, atr_m=2.5, risk=0.25%, trend=none, regime=adx20
- IS: 수익률 -0.96%, MDD -2.52%, 거래 24, 승률 16.67%, PF 0.71, 평균R -0.152
- OOS: 수익률 0.74%, MDD -0.67%, 거래 6, 승률 50.00%, PF 2.41, 평균R 0.467

### 2) lb55_atr14_m3.0_r0.0025_tfnone_rfadx20
- 파라미터: lb=55, atr_p=14, atr_m=3.0, risk=0.25%, trend=none, regime=adx20
- IS: 수익률 0.19%, MDD -1.77%, 거래 19, 승률 26.32%, PF 1.09, 평균R 0.037
- OOS: 수익률 0.50%, MDD -0.62%, 거래 6, 승률 66.67%, PF 2.20, 평균R 0.319

### 3) lb55_atr14_m3.0_r0.005_tfnone_rfadx20
- 파라미터: lb=55, atr_p=14, atr_m=3.0, risk=0.50%, trend=none, regime=adx20
- IS: 수익률 0.34%, MDD -3.51%, 거래 19, 승률 26.32%, PF 1.08, 평균R 0.037
- OOS: 수익률 1.00%, MDD -1.23%, 거래 6, 승률 66.67%, PF 2.19, 평균R 0.319

### 4) lb55_atr10_m2.5_r0.005_tfnone_rfadx20
- 파라미터: lb=55, atr_p=10, atr_m=2.5, risk=0.50%, trend=none, regime=adx20
- IS: 수익률 -1.97%, MDD -4.97%, 거래 24, 승률 16.67%, PF 0.71, 평균R -0.152
- OOS: 수익률 1.47%, MDD -1.34%, 거래 6, 승률 50.00%, PF 2.39, 평균R 0.467

### 5) lb55_atr10_m2.5_r0.0025_tfma100_rfadx20
- 파라미터: lb=55, atr_p=10, atr_m=2.5, risk=0.25%, trend=ma100, regime=adx20
- IS: 수익률 -1.38%, MDD -2.52%, 거래 23, 승률 8.70%, PF 0.62, 평균R -0.227
- OOS: 수익률 0.74%, MDD -0.67%, 거래 6, 승률 50.00%, PF 2.41, 평균R 0.467

## OOS 리더보드 (MDD 제약 기반)

- 조건: OOS 거래 >= 5, OOS MDD >= -1.50%

1. lb55_atr10_m2.5_r0.005_tfnone_rfadx20 | OOS 수익률 1.47%, MDD -1.34%, PF 2.39, 거래 6, 평균R 0.467
2. lb55_atr10_m2.5_r0.005_tfma100_rfadx20 | OOS 수익률 1.47%, MDD -1.34%, PF 2.39, 거래 6, 평균R 0.467
3. lb55_atr10_m3.0_r0.005_tfnone_rfadx20 | OOS 수익률 1.07%, MDD -1.33%, PF 2.24, 거래 6, 평균R 0.341
4. lb55_atr10_m3.0_r0.005_tfma100_rfadx20 | OOS 수익률 1.07%, MDD -1.33%, PF 2.24, 거래 6, 평균R 0.341
5. lb55_atr14_m3.0_r0.005_tfnone_rfadx20 | OOS 수익률 1.00%, MDD -1.23%, PF 2.19, 거래 6, 평균R 0.319

## 추천 조합

### 보수형 추천 (낮은 DD 우선)
- lb55_atr10_m2.5_r0.0025_tfnone_rfadx20 | OOS 수익률 0.74%, MDD -0.67%, PF 2.41, 평균R 0.467

### 공격형 추천 (수익률 우선)
- lb55_atr10_m2.5_r0.005_tfnone_rfadx20 | OOS 수익률 1.47%, MDD -1.34%, PF 2.39, 평균R 0.467

## 실전 투입 전 체크리스트
- [ ] 수수료/슬리피지를 실계정 체결 로그 기반으로 재추정
- [ ] 시간대별 유동성(야간/주말) 구간에서 성능 저하 여부 점검
- [ ] 워크포워드(rolling) 재검증으로 구간 과최적화 재확인
- [ ] 거래소 API 장애/지연 대비 비상 청산 로직 점검
- [ ] 포지션 사이징 상한(총노출, 연속손실 제한) 적용
- [ ] 페이퍼 트레이딩 1~2주 실시간 검증 후 소액 실거래 전환


## Risk-First Leaderboard Snapshot (2026-02-23 08:38:52 KST )

- 우선순위: MDD(절대) → 손실변동성(안정성) → OOS 수익률(동률 시)
- 제약: MDD >= -1.00%, 저소음(거래수 과다 회피), 리스크 0.25% 선호
- caution: NO (MDD -1.00% 조건 미충족 시 least-bad 선택)

- 1. lb55_atr20_m3.0_r0.0025_tfnone_rfadx20 | OOS 0.46% | MDD -0.60% | trades 6 | risk 0.25% | stabilityΔ 1.52%\n- 2. lb55_atr20_m3.0_r0.0025_tfma100_rfadx20 | OOS 0.46% | MDD -0.60% | trades 6 | risk 0.25% | stabilityΔ 1.80%\n- 3. lb55_atr14_m3.0_r0.0025_tfnone_rfadx20 | OOS 0.50% | MDD -0.62% | trades 6 | risk 0.25% | stabilityΔ 0.31%\n- 4. lb55_atr14_m3.0_r0.0025_tfma100_rfadx20 | OOS 0.50% | MDD -0.62% | trades 6 | risk 0.25% | stabilityΔ 0.64%\n- 5. lb55_atr10_m3.0_r0.0025_tfnone_rfadx20 | OOS 0.54% | MDD -0.67% | trades 6 | risk 0.25% | stabilityΔ 0.93%\n