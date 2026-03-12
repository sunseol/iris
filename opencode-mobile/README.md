# OpenCode Mobile

Android-first remote companion MVP for controlling OpenCode running on a host machine.

> This project is **not built by the OpenCode team** and is **not affiliated with anomalyco/OpenCode**. It is an independent companion project.

## What exists now
- `app/` — Expo React Native mobile client with separated Chat / Settings surfaces
- `bridge/` — Node WebSocket bridge with JSON-RPC style protocol
- adapter system with two modes:
  - `stub` — in-memory fake runtime for UI/protocol development
  - `process` — process-backed runtime adapter that can spawn a real OpenCode CLI session

## Implemented MVP surface
### Mobile app
- **Chat screen**
  - simple chat timeline
  - prompt composer
  - approval cards for permission-required actions
- **Settings screen**
  - bridge endpoint input + connect flow
  - connection status banner/actions
  - host status / runtime info card
  - recent endpoint/session persistence via SecureStore
  - session list with previews/status/time
  - session create / resume actions
  - pairing code field for QR onboarding
  - real camera-based QR scanner path
  - simulated QR import fallback
- restore-first behavior scaffolding
- approval responses wired to bridge RPC

### Bridge
- JSON-RPC style request/response API
- `connection.info`
- `session.list`
- `session.create`
- `session.resume`
- `message.send`
- `task.cancel`
- `approval.respond`
- `message.delta` / `message.done` / `task.error` / `session.updated`
- `approval.requested` / `approval.resolved`
- adapter abstraction for swapping stub vs real runtime
- process-mode session metadata persistence for restore flow
- runtime parser split out for future calibration

## Current gap
The remaining work is now mostly production hardening rather than basic feature construction:
- QR onboarding edge-case UX (permission-denied / malformed payloads)
- approval model is bridge-side consent rather than a proven native OpenCode approval API
- broader reconnect / restart operational polish
- deployment/ops documentation tightening

## Recommended next steps
1. harden reconnect UX and restart persistence end-to-end
2. tighten approval UX/copy around bridge-side consent semantics
3. finish QR onboarding edge-case polish on-device
4. document deployment/ops and recovery workflow clearly

## Ops docs
- `BETA.md` — external tester handoff, beta scope, known limits, reporting template
- `PRODUCTION_CHECKLIST.md` — current production-readiness status
- `RECOVERY.md` — bridge restart / session recovery workflow
- `deploy/DEPLOYMENT.md` — deployment and service packaging notes
- `deploy/opencode-mobile-bridge.service` — reference systemd unit
