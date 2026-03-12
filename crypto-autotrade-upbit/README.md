# Upbit Auto Trading Bot (Scalping MVP)

업비트 KRW 마켓용 자동매매봇 MVP입니다.

## 목표
- 전략: 1분봉 기반 준-스켈핑
- 모드: `paper`(모의) / `live`(실거래)
- 안전장치: 일손실 제한, 최대 포지션 수, 킬스위치

## 기능(현재)
- 프로젝트 구조/설정 로더
- 전략 인터페이스 + 샘플 전략(EMA + RSI)
- 리스크 매니저(포지션 사이즈/일손실 제한)
- 실행기 인터페이스(업비트 연동 자리)
- 메인 루프 스켈레톤

## 설치
```bash
cd crypto-autotrade-upbit
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 실행
```bash
cp .env.example .env
# .env 값 채우기
python -m src.bot.main
```

## 필수 환경변수
- `MODE`: `paper` 또는 `live`
- `UPBIT_ACCESS_KEY`: 업비트 API access key
- `UPBIT_SECRET_KEY`: 업비트 API secret key
- `TELEGRAM_BOT_TOKEN` (선택)
- `TELEGRAM_CHAT_ID` (선택)

## 주의
- 이 코드는 투자 조언이 아닙니다.
- 반드시 `paper` 모드로 충분히 검증 후 `live`로 전환하세요.
- 실제 주문 전, 주문 최소금액/수수료/슬리피지 반영 필요.
