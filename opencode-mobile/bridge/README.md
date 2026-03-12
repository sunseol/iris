# OpenCode Mobile Bridge

Node WebSocket bridge for the OpenCode Mobile MVP.

## Modes
- `stub`: UI development mode with in-memory sessions and fake streaming output
- `process`: experimental runtime mode that spawns a real OpenCode CLI process per session

## Implemented protocol methods
- `connection.info`
- `session.list`
- `session.create`
- `session.resume`
- `message.send`
- `task.cancel`
- `approval.respond`

## Implemented event methods
- `connection.ready`
- `session.updated`
- `message.delta`
- `message.done`
- `task.error`
- `approval.requested`
- `approval.resolved`

## QR pairing + tunnel flow
You can expose the bridge through a public tunnel and print a pairing QR for the mobile app:

```bash
cd bridge
npm run pairing:qr
```

What it does:
- opens a websocket-capable public tunnel to the local bridge port (`7345` by default)
- generates an `opencode-bridge` JSON payload with a public `wss://...` endpoint
- writes artifacts to `bridge/data/`
  - `pairing-latest.json`
  - `pairing-latest.html`
- prints a terminal QR that the mobile app can scan

The mobile app QR flow will:
- scan the QR
- parse the OpenCode bridge payload
- save endpoint/pairing info
- immediately attempt bridge connection

## Current limitation
The `process` mode is generic and still needs calibration against the exact installed OpenCode CLI behavior.
Approval detection is currently heuristic until real runtime semantics are confirmed.
