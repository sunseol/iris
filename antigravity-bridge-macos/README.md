# Antigravity IDE Bridge (macOS)

맥에서 **안티그래비티 IDE를 API로 제어**하기 위한 로컬 브리지입니다.

## 기능 (MVP+)
- IDE 활성화
- 프로젝트 열기
- 텍스트 타이핑 / 키 입력
- IDE 내 터미널 명령 입력
- 클립보드/복사 기반 읽기 (`copy`, `copy-all`, `clipboard`)
- 고수준 왕복 호출: `send-prompt-and-get-response` (`agctl.py ask`)

## 0) 사전 준비
1. macOS에서 Python 3.10+
2. 안티그래비티 IDE 설치
3. 접근성 권한 허용
   - 시스템 설정 → 개인정보 보호 및 보안 → 손쉬운 사용(Accessibility)
   - 터미널/iTerm/실행 프로세스 허용

## 1) 설치
```bash
cd antigravity-bridge-macos
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

`.env` 값 수정:
- `APP_NAME`: 우선 시도할 앱 이름 (기본 `Antigravity`)
- `APP_CANDIDATES`: 자동 탐지 후보(쉼표 구분). 기본 `Antigravity,Antigravity IDE`
- `BRIDGE_TOKEN`: 긴 랜덤 문자열로 변경
- `HOST`, `PORT`: 기본 그대로 권장 (`127.0.0.1:8787`)

## 2) 실행
```bash
source .venv/bin/activate
uvicorn bridge:app --host 127.0.0.1 --port 8787 --reload
```

## 3) 테스트
```bash
curl http://127.0.0.1:8787/health
```

## 4) 로컬 CLI (`agctl.py`)
브리지 API를 직접 curl로 치기 번거로우면 아래 CLI를 사용하세요.

```bash
cd antigravity-bridge-macos
./agctl.py health
./agctl.py activate
./agctl.py open-project /Users/you/Projects/my-app
./agctl.py type "hello"
./agctl.py key return
./agctl.py run "npm test"
./agctl.py prompt "이 파일에서 버그 찾아줘"
./agctl.py ask "현재 프로젝트 구조 5줄 요약해줘" --wait 3 --attempts 3
./agctl.py copy
./agctl.py copy-all
./agctl.py clipboard
./agctl.py cockpit-log-tail --lines 80
```

> `.env`의 `BRIDGE_TOKEN`을 자동으로 읽습니다.

### IDE 활성화
```bash
curl -X POST http://127.0.0.1:8787/activate \
  -H "x-bridge-token: YOUR_TOKEN"
```

### 프로젝트 열기
```bash
curl -X POST http://127.0.0.1:8787/open-project \
  -H "Content-Type: application/json" \
  -H "x-bridge-token: YOUR_TOKEN" \
  -d '{"path":"/Users/you/Projects/my-app"}'
```

### 텍스트 입력
```bash
curl -X POST http://127.0.0.1:8787/type \
  -H "Content-Type: application/json" \
  -H "x-bridge-token: YOUR_TOKEN" \
  -d '{"text":"hello from bridge"}'
```

### 키 입력 (Enter)
```bash
curl -X POST http://127.0.0.1:8787/key \
  -H "Content-Type: application/json" \
  -H "x-bridge-token: YOUR_TOKEN" \
  -d '{"key":"return"}'
```

### IDE 터미널에 명령 실행
```bash
curl -X POST http://127.0.0.1:8787/run-in-terminal \
  -H "Content-Type: application/json" \
  -H "x-bridge-token: YOUR_TOKEN" \
  -d '{"command":"npm test","submit":true}'
```

---

## OpenClaw 연동 아이디어
- OpenClaw가 로컬에서 `./agctl.py`를 실행하게 하면,
  "안티그래비티에서 X 해줘"를 자동 수행 가능.
- 보안상 `127.0.0.1` 바인딩 유지 + 토큰 필수.

예시(에이전트가 실행할 명령):
```bash
cd /home/jakeseol/.openclaw/workspace/antigravity-bridge-macos
./agctl.py activate
./agctl.py open-project /Users/you/Projects/my-app
./agctl.py run "npm run dev"
./agctl.py prompt "로그 보고 원인 분석해줘"
```

## 주의
- AppleScript 기반 자동화라 UI 포커스/단축키 변경에 민감합니다.
- 단축키가 기본값이 아니면 `bridge.py`의 키 시퀀스를 조정하세요.
