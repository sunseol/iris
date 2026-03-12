import os
import subprocess
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

load_dotenv()

APP_NAME = os.getenv("APP_NAME", "Antigravity")
APP_CANDIDATES = [
    x.strip()
    for x in os.getenv("APP_CANDIDATES", "Antigravity,Antigravity IDE").split(",")
    if x.strip()
]
BRIDGE_TOKEN = os.getenv("BRIDGE_TOKEN", "change-me")

app = FastAPI(title="Antigravity macOS Bridge")


class OpenProjectRequest(BaseModel):
    path: str


class TypeRequest(BaseModel):
    text: str


class KeyRequest(BaseModel):
    key: str  # e.g. "return", "tab", "escape"
    command: bool = False
    shift: bool = False
    option: bool = False
    control: bool = False


class RunInTerminalRequest(BaseModel):
    command: str
    submit: bool = True


class WaitRequest(BaseModel):
    seconds: float = 1.0


class PromptRequest(BaseModel):
    text: str
    wait_seconds: float = Field(default=2.0, ge=0.1, le=30.0)
    max_attempts: int = Field(default=2, ge=1, le=5)
    verify_mode: str = Field(default="clipboard_change")  # clipboard_change|nonempty|none


def _auth(x_bridge_token: Optional[str]):
    if x_bridge_token != BRIDGE_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid bridge token")


def _osascript(script: str) -> str:
    result = subprocess.run(
        ["osascript", "-e", script],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "AppleScript failed")
    return result.stdout.strip()


def _resolve_app_name() -> str:
    candidates = [APP_NAME] + [c for c in APP_CANDIDATES if c != APP_NAME]

    for name in candidates:
        try:
            _osascript(f'tell application "{name}" to activate')
            return name
        except Exception:
            pass

    try:
        running = _osascript('tell application "System Events" to get name of every process')
        running_lc = running.lower()
        for name in candidates:
            if name.lower() in running_lc:
                return name
        if "antigravity" in running_lc:
            for part in running.split(","):
                p = part.strip()
                if "antigravity" in p.lower():
                    return p
    except Exception:
        pass

    raise HTTPException(
        status_code=503,
        detail={
            "code": "app_not_found",
            "message": f"Could not find app. Tried: {', '.join(candidates)}",
        },
    )


def _activate_app() -> str:
    app_name = _resolve_app_name()
    _osascript(f'tell application "{app_name}" to activate')
    return app_name


def _clipboard_text() -> str:
    result = subprocess.run(["pbpaste"], capture_output=True, text=True, check=False)
    return result.stdout


def _type_and_enter(text: str):
    safe = text.replace('"', '\\"')
    _osascript(f'tell application "System Events" to keystroke "{safe}"')
    _osascript('tell application "System Events" to key code 36')


@app.get("/health")
def health():
    return {"ok": True, "app": APP_NAME, "candidates": APP_CANDIDATES}


@app.post("/activate")
def activate(x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    app_name = _activate_app()
    return {"ok": True, "app": app_name}


@app.post("/open-project")
def open_project(req: OpenProjectRequest, x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    app_name = _activate_app()
    safe_path = req.path.replace('"', '\\"')
    script = f'''
    tell application "System Events"
      tell process "{app_name}"
        keystroke "o" using {{command down, shift down}}
        delay 0.2
        keystroke "{safe_path}"
        key code 36
      end tell
    end tell
    '''
    _osascript(script)
    return {"ok": True, "action": "open-project", "path": req.path, "app": app_name}


@app.post("/type")
def type_text(req: TypeRequest, x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    _activate_app()
    safe = req.text.replace('"', '\\"')
    _osascript(f'tell application "System Events" to keystroke "{safe}"')
    return {"ok": True, "typed": len(req.text)}


@app.post("/key")
def press_key(req: KeyRequest, x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    _activate_app()

    mods = []
    if req.command:
        mods.append("command down")
    if req.shift:
        mods.append("shift down")
    if req.option:
        mods.append("option down")
    if req.control:
        mods.append("control down")

    using_clause = ""
    if mods:
        using_clause = f" using {{{', '.join(mods)}}}"

    script = f'tell application "System Events" to key code {_key_to_code(req.key)}{using_clause}'
    _osascript(script)
    return {"ok": True, "key": req.key}


@app.post("/run-in-terminal")
def run_in_terminal(req: RunInTerminalRequest, x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    _activate_app()
    cmd = req.command.replace('"', '\\"')

    # Common shortcut for opening IDE integrated terminal in many editors: Cmd+`
    _osascript(
        f'tell application "System Events" to key code 50 using {{command down}}'
    )
    _osascript(f'tell application "System Events" to keystroke "{cmd}"')
    if req.submit:
        _osascript('tell application "System Events" to key code 36')

    return {"ok": True, "ran": req.command}


@app.get("/clipboard")
def get_clipboard(x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    result = subprocess.run(["pbpaste"], capture_output=True, text=True, check=False)
    return {"ok": True, "text": result.stdout}


@app.post("/copy")
def copy_shortcut(x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    _activate_app()
    _osascript('tell application "System Events" to keystroke "c" using {command down}')
    time.sleep(0.15)
    result = subprocess.run(["pbpaste"], capture_output=True, text=True, check=False)
    return {"ok": True, "text": result.stdout}


@app.post("/copy-all")
def copy_all(x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    _activate_app()
    _osascript('tell application "System Events" to keystroke "a" using {command down}')
    time.sleep(0.1)
    _osascript('tell application "System Events" to keystroke "c" using {command down}')
    time.sleep(0.2)
    result = subprocess.run(["pbpaste"], capture_output=True, text=True, check=False)
    return {"ok": True, "text": result.stdout}


@app.get("/cockpit-log-tail")
def cockpit_log_tail(x_bridge_token: Optional[str] = Header(None), lines: int = 120):
    _auth(x_bridge_token)
    logs_dir = Path.home() / "Library/Application Support/Antigravity/logs"
    if not logs_dir.exists():
        return {"ok": False, "error": "logs dir not found"}

    log_files = sorted(logs_dir.glob("*/window*/exthost/output_logging_*/**/*Antigravity Cockpit.log"))
    if not log_files:
        return {"ok": False, "error": "cockpit log not found"}

    latest = log_files[-1]
    try:
        content = latest.read_text(encoding="utf-8", errors="ignore").splitlines()[-max(1, min(lines, 2000)):]
    except Exception as e:
        return {"ok": False, "error": str(e), "path": str(latest)}

    return {"ok": True, "path": str(latest), "lines": content}


@app.post("/send-prompt-and-get-response")
def send_prompt_and_get_response(req: PromptRequest, x_bridge_token: Optional[str] = Header(None)):
    _auth(x_bridge_token)
    _activate_app()

    baseline = _clipboard_text()
    last_error = None

    for attempt in range(1, req.max_attempts + 1):
        try:
            _type_and_enter(req.text)
            time.sleep(req.wait_seconds)
            _osascript('tell application "System Events" to keystroke "a" using {command down}')
            time.sleep(0.1)
            _osascript('tell application "System Events" to keystroke "c" using {command down}')
            time.sleep(0.2)
            captured = _clipboard_text()

            changed = captured != baseline
            nonempty = bool(captured.strip())

            ok = False
            if req.verify_mode == "none":
                ok = True
            elif req.verify_mode == "nonempty":
                ok = nonempty
            else:
                ok = changed and nonempty

            if ok:
                return {
                    "ok": True,
                    "attempt": attempt,
                    "verify_mode": req.verify_mode,
                    "changed": changed,
                    "response": captured,
                }

            last_error = "verification_failed"
        except Exception as e:
            msg = str(e)
            last_error = msg
            if "1002" in msg:
                raise HTTPException(
                    status_code=503,
                    detail={
                        "code": "accessibility_denied",
                        "message": msg,
                    },
                )

        time.sleep(0.3)

    raise HTTPException(
        status_code=504,
        detail={
            "code": "response_not_observed",
            "message": "Prompt sent but response could not be verified",
            "last_error": last_error,
        },
    )


def _key_to_code(key: str) -> int:
    mapping = {
        "return": 36,
        "enter": 76,
        "tab": 48,
        "space": 49,
        "escape": 53,
        "delete": 51,
        "up": 126,
        "down": 125,
        "left": 123,
        "right": 124,
    }
    if key not in mapping:
        raise HTTPException(status_code=400, detail=f"Unsupported key: {key}")
    return mapping[key]
