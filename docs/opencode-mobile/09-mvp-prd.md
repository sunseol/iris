# MVP PRD

Status: draft

## Product Name
Working name: OpenCode Mobile Bridge

## Product Summary
An Android-first mobile companion app that lets a user reconnect to and interact with OpenCode running on a host machine.

The MVP focuses on:
- connecting to a host bridge
- opening or resuming a session
- sending prompts
- viewing streamed output
- cancelling running tasks
- restoring the last connection/session when reopening the app

## Target User
A developer who already runs OpenCode on their own machine and wants lightweight mobile access to an active coding session.

## Core User Problems
1. I want to check or continue an OpenCode session from my phone.
2. I want quick visibility into what OpenCode is doing without opening my laptop.
3. I want the app to return me to the last active session automatically.

## Non-Goals
- no git operations
- no background persistent connection guarantee
- no push notifications in MVP
- no hosted relay in MVP
- no file attachments in MVP

## Core Flows
### Flow 1: First connection
1. open app
2. add bridge endpoint or scan QR
3. connect to bridge
4. create a new session or open an existing one
5. chat with OpenCode

### Flow 2: Return to previous work
1. reopen app
2. app checks stored recent endpoint and session
3. app pings the bridge
4. if valid, app auto-redirects to the most recent session
5. if invalid, app falls back to connect/session list

### Flow 3: Stop a task
1. user sees in-progress task
2. taps cancel
3. app sends `task.cancel`
4. bridge stops or interrupts the underlying runtime
5. app shows resulting state

## MVP Features
### App
- connect to bridge
- persist recent endpoint
- persist recent session id
- session list screen
- session chat screen
- streamed output rendering
- task running/completed/error state
- cancel button
- restore-first startup flow

### Bridge
- accept WebSocket connection from app
- expose minimal JSON-RPC style API
- create/resume session
- forward messages to OpenCode
- stream output back to app
- provide session metadata for restore flow
- support task cancel

## Success Criteria
- user can connect from Android to a host bridge
- user can create or resume a session
- user can send a prompt and see streamed output
- user can reopen the app and get redirected to the recent session when available

## Risks
- OpenCode server surface may not be open enough for direct integration
- PTY fallback may increase complexity
- session restore semantics may depend on OpenCode internals

## MVP Verdict Dependency
This PRD assumes the project remains feasible after Phase 1 validation.

## Next Action
Finalize the bridge feasibility verdict and convert this PRD into implementation tickets.
