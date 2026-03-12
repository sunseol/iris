# JSON-RPC Protocol Draft

Status: draft

## Goal
Define a minimal app-to-bridge protocol for the Android MVP.

## Scope
This protocol is for:
- connection bootstrap
- session listing
- session creation/resume
- message send
- task streaming
- task cancel
- restore-first navigation

Out of scope:
- git commands
- background sync orchestration
- file transfer
- push notifications

## Transport
- WebSocket connection between app and bridge
- JSON payloads
- request/response semantics for commands
- notifications/events for streaming updates

## Envelope
### Request
```json
{
  "jsonrpc": "2.0",
  "id": "req_123",
  "method": "session.create",
  "params": {}
}
```

### Response
```json
{
  "jsonrpc": "2.0",
  "id": "req_123",
  "result": {}
}
```

### Event / Notification
```json
{
  "jsonrpc": "2.0",
  "method": "message.delta",
  "params": {}
}
```

## Request Methods
### `connection.ping`
Check whether the bridge is alive.

### `session.list`
Return recent/available sessions.

### `session.create`
Create a new remote OpenCode session.

Params:
```json
{
  "workspace": "/path/to/project"
}
```

### `session.resume`
Resume a known session.

Params:
```json
{
  "sessionId": "sess_123"
}
```

### `message.send`
Send a prompt/user message into a session.

Params:
```json
{
  "sessionId": "sess_123",
  "text": "Fix the login bug"
}
```

### `task.cancel`
Cancel the currently running task in a session.

Params:
```json
{
  "sessionId": "sess_123"
}
```

## Event Methods
### `connection.ready`
Bridge is connected and ready.

### `session.created`
A session was created.

### `session.updated`
Session metadata changed.

### `message.delta`
Stream partial assistant output.

### `message.done`
Assistant message completed.

### `task.status`
Task status update.

Params example:
```json
{
  "sessionId": "sess_123",
  "status": "running"
}
```

### `task.complete`
Task finished successfully.

### `task.error`
Task failed or was interrupted.

## Restore-Oriented App Behavior
The app stores locally:
- recent bridge endpoint
- recent session id
- recent route

On relaunch:
1. ping recent bridge
2. if reachable, call `session.resume` or `session.list`
3. redirect to the last known session if valid
4. otherwise fall back to connect/session selection UI

## Error Model
Bridge errors should return JSON-RPC error objects with:
- code
- message
- optional data

## Open Questions
- whether approvals need to be modeled in MVP
- whether OpenCode server mode exposes native event hooks
- whether session IDs are stable enough across bridge restarts

## Next Action
Translate this draft into a concrete TypeScript schema once bridge feasibility is confirmed.
