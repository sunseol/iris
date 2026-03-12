# Feasibility Verdict Draft

Status: draft

## Current Verdict
**Preliminary rating: B — fit with adapter cost**

## Basis
This verdict is based on public web research only, not direct CLI/runtime inspection.

## Why It Looks Promising
1. OpenCode explicitly describes itself as having a client/server architecture.
2. Public copy explicitly mentions the possibility of driving OpenCode remotely from a mobile app.
3. Multi-session support is publicly advertised.
4. Permission-aware behavior already exists in at least one built-in agent.

## Why The Verdict Is Not Higher Yet
We still do not have confirmed evidence for:
- machine-readable output
- CLI control surface
- session resume behavior
- cancellation behavior
- protocol accessibility for third-party clients

## Practical Interpretation
The project is likely viable, but MVP strategy depends on one of two outcomes:

### Path A — Internal/public protocol is usable
Best case.
- Build a thin Node bridge around OpenCode’s existing client/server interface.
- Android app talks to the bridge over WebSocket.
- Lower maintenance burden.

### Path B — Only TUI/CLI integration is practical
Still viable.
- Wrap OpenCode in a PTY-based host bridge.
- Parse stdout/stderr into app events.
- Higher maintenance cost, but still realistic for an MVP.

## Recommendation
Continue to Phase 1 evidence gathering before writing the final MVP PRD.

## Next Action
Confirm actual CLI/help surface and determine whether JSON/protocol access exists.
