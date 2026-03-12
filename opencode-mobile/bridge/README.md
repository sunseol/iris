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

## Current limitation
The `process` mode is generic and still needs calibration against the exact installed OpenCode CLI behavior.
Approval detection is currently heuristic until real runtime semantics are confirmed.
