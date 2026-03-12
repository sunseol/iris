# 인터파크 티켓 도우미 CLI

Interpark 모바일 티켓 페이지(`https://mobileticket.interpark.com/goods/26002204`)를 수동 구매 보조용으로 점검하는 Node.js CLI입니다.

## 주요 기능

- 설정 파일 기반 동작
- 모니터링 모드: 페이지 제목/본문 텍스트를 확인해 상태 로그를 타임스탬프와 함께 출력
- 런치 모드: 설정한 판매 시작 시각 기준으로 브라우저 실행
- 선택 항목: URL 클립보드 복사

SAFE 원칙:

- CAPTCHA 우회 없음
- 계정/패스워드 자동입력, credential stuffing 없음
- 봇 회피 우회 동작 없음

## 설치

```bash
cd interpark-ticket-assistant
npm install
```

## 설정 파일

샘플 파일을 복사해 사용하세요.

```bash
cp config.sample.json config.json
```

`config.json`에 다음 값을 설정합니다.

- `targetUrl`: 모니터링할 페이지 URL
- `pollIntervalMs`: 모니터링 루프 간격(밀리초)
- `targetSaleDateTimeKst`: 판매 시작시각(예: `2026-03-01T19:00:00+09:00`)
- `openBrowserSecondsBefore`: 런치 모드에서 오픈 시각 N초 전 브라우저 오픈
- `autoRefreshCountdown`: 런치 모드에서 주기적으로 페이지 상태 재확인 간격(초), 0 또는 미설정이면 비활성화
- `copyUrlToClipboard`: 런치 모드에서 URL 자동 복사 여부
- `requestTimeoutMs`: HTTP 요청 타임아웃(ms)
- `stopOnAvailable`: 모니터링 시 `available` 감지 시 종료할지 여부

## 실행 예시

- 모니터링 모드:

```bash
npm run monitor -- --config config.json
```

- 한 번만 체크:

```bash
npm run monitor -- --config config.json --once
```

- 브라우저 오픈 모드(옵션으로 클립보드 복사):

```bash
npm run launch -- --config config.json --copy
```

## 출력 예시

```
[2026-02-23 00:00:00+09:00] [monitor] 대상 ... 상태=unknown ...
[2026-02-23 00:00:01+09:00] [launch] 브라우저를 열었습니다.
```

## 법적 고지

- 이 도구는 티켓 예매 자동화(스크립트 기반 구매 확정/결제 자동화/로그인·계정 자동입력)를 수행하지 않습니다.
- 웹페이지에서 CAPTCHA가 요구되면 사용자가 직접 처리해야 합니다.
- 웹사이트 이용약관, robots 정책, 법적/플랫폼 제한을 준수해야 합니다.
- 과도한 폴링으로 운영자에게 부담을 줄 수 있으므로 `pollIntervalMs`를 과도하게 짧게 설정하지 마세요.
