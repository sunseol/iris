# OpenCode Mobile Production Checklist

## Core runtime path
- [x] OpenCode installed and callable as `opencode`
- [x] `opencode run --format json` verified on host
- [x] bridge process mode wired to real OpenCode runtime
- [x] assistant text streaming works end-to-end
- [x] tool use events surface through bridge
- [x] runtime session id captured from OpenCode output
- [x] same bridge session can reuse same OpenCode runtime session
- [x] native cancel kills real OpenCode child process

## Approval behavior
- [x] real approval-style prompt reproduced from runtime transcript
- [x] `approval.requested` emitted from bridge for real approval-style assistant text
- [x] false positive on ordinary output (e.g. `APPROVED_BY_USER`) fixed
- [x] `approval.respond` affects next-command consent state in bridge
- [ ] native structured OpenCode approval API confirmed (not yet proven)

## Mobile app
- [x] Chat / Settings split implemented
- [x] runtime metadata shown in UI
- [x] approval cards shown in UI
- [x] host/runtime info shown in settings
- [x] real camera-based QR scanner path exists
- [x] malformed QR payload handling exists
- [x] camera permission denial guidance exists

## Persistence / recovery
- [x] bridge persists session metadata
- [x] bridge persists message history
- [x] restart restores sessions from disk
- [x] restart restores message history from disk
- [ ] app-side reconnect and auto-resume fully hardened across all restart cases

## Remaining production work
1. Clarify/document that current approval model is bridge-side consent unless OpenCode exposes a stronger native approval primitive.
2. Harden reconnect and auto-resume behavior on real mobile devices.
3. Validate the documented deployment/recovery flow in the target environment.
4. Decide whether systemd is sufficient or if pm2/container packaging is needed.
