#!/usr/bin/env python3
import argparse
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path


def load_env(path: Path):
    if not path.exists():
        return
    for line in path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        k, v = line.split('=', 1)
        os.environ.setdefault(k.strip(), v.strip())


def call_api(base_url: str, token: str, endpoint: str, payload: dict | None = None, method: str | None = None):
    url = f"{base_url.rstrip('/')}{endpoint}"
    data = None
    headers = {"x-bridge-token": token}
    if payload is not None:
        data = json.dumps(payload).encode('utf-8')
        headers['Content-Type'] = 'application/json'

    if method is None:
        method = 'POST' if payload is not None or endpoint != '/health' else 'GET'

    req = urllib.request.Request(url, method=method, headers=headers, data=data)
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            body = res.read().decode('utf-8')
            return res.status, body
    except urllib.error.HTTPError as e:
        msg = e.read().decode('utf-8', errors='ignore')
        return e.code, msg
    except Exception as e:
        return 0, str(e)


def main():
    root = Path(__file__).resolve().parent
    load_env(root / '.env')

    parser = argparse.ArgumentParser(description='Antigravity Bridge CLI')
    parser.add_argument('--url', default=f"http://{os.getenv('HOST', '127.0.0.1')}:{os.getenv('PORT', '8787')}")
    parser.add_argument('--token', default=os.getenv('BRIDGE_TOKEN', ''))

    sub = parser.add_subparsers(dest='cmd', required=True)
    sub.add_parser('health')
    sub.add_parser('activate')

    p_open = sub.add_parser('open-project')
    p_open.add_argument('path')

    p_type = sub.add_parser('type')
    p_type.add_argument('text')

    p_key = sub.add_parser('key')
    p_key.add_argument('key')
    p_key.add_argument('--command', action='store_true')
    p_key.add_argument('--shift', action='store_true')
    p_key.add_argument('--option', action='store_true')
    p_key.add_argument('--control', action='store_true')

    p_run = sub.add_parser('run')
    p_run.add_argument('command')
    p_run.add_argument('--no-submit', action='store_true')

    p_prompt = sub.add_parser('prompt')
    p_prompt.add_argument('text', help='type text then press Enter')

    p_ask = sub.add_parser('ask')
    p_ask.add_argument('text', help='send prompt and try to fetch response')
    p_ask.add_argument('--wait', type=float, default=2.0)
    p_ask.add_argument('--attempts', type=int, default=2)
    p_ask.add_argument('--verify', choices=['clipboard_change', 'nonempty', 'none'], default='clipboard_change')

    sub.add_parser('clipboard')
    sub.add_parser('copy')
    sub.add_parser('copy-all')

    p_log = sub.add_parser('cockpit-log-tail')
    p_log.add_argument('--lines', type=int, default=120)

    args = parser.parse_args()

    if args.cmd != 'health' and not args.token:
        print('Missing BRIDGE_TOKEN. Set in .env or pass --token', file=sys.stderr)
        sys.exit(2)

    if args.cmd == 'health':
        code, body = call_api(args.url, args.token or '', '/health', None)
    elif args.cmd == 'activate':
        code, body = call_api(args.url, args.token, '/activate', {})
    elif args.cmd == 'open-project':
        code, body = call_api(args.url, args.token, '/open-project', {'path': args.path})
    elif args.cmd == 'type':
        code, body = call_api(args.url, args.token, '/type', {'text': args.text})
    elif args.cmd == 'key':
        code, body = call_api(
            args.url,
            args.token,
            '/key',
            {
                'key': args.key,
                'command': args.command,
                'shift': args.shift,
                'option': args.option,
                'control': args.control,
            },
        )
    elif args.cmd == 'run':
        code, body = call_api(args.url, args.token, '/run-in-terminal', {'command': args.command, 'submit': not args.no_submit})
    elif args.cmd == 'prompt':
        code, body = call_api(args.url, args.token, '/type', {'text': args.text})
        if code >= 200 and code < 300:
            code, body = call_api(args.url, args.token, '/key', {'key': 'return'})
    elif args.cmd == 'ask':
        code, body = call_api(
            args.url,
            args.token,
            '/send-prompt-and-get-response',
            {
                'text': args.text,
                'wait_seconds': args.wait,
                'max_attempts': args.attempts,
                'verify_mode': args.verify,
            },
        )
    elif args.cmd == 'clipboard':
        code, body = call_api(args.url, args.token, '/clipboard', None, method='GET')
    elif args.cmd == 'copy':
        code, body = call_api(args.url, args.token, '/copy', {})
    elif args.cmd == 'copy-all':
        code, body = call_api(args.url, args.token, '/copy-all', {})
    elif args.cmd == 'cockpit-log-tail':
        code, body = call_api(args.url, args.token, f"/cockpit-log-tail?lines={args.lines}", None, method='GET')
    else:
        parser.print_help()
        return

    print(body)
    if code < 200 or code >= 300:
        sys.exit(1)


if __name__ == '__main__':
    main()
