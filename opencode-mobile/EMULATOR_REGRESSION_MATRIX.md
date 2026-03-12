# Emulator Regression Matrix

This file defines the official Android emulator regression lane for `opencode-mobile`.

## Scope rules
- `EXPO_PUBLIC_AUTOTEST_*` remains **test-only**.
- Production runtime path stays unchanged.
- Emulator regression is allowed to use test-only env flags, seeded prompts, and bridge restarts to force scenarios.

## P0 happy path
### Scenario: connect → create session → send `hi` → assistant reply
- Priority: P0
- Pass criteria:
  - app launches on emulator
  - bridge connection becomes `connected`
  - session is created
  - `hi` is sent
  - `sessions.json` contains new user message and assistant reply
  - latest persisted session is `idle` with non-empty `lastMessagePreview`
- Evidence:
  - `adb logcat` filtered for `autotest`, `session.create`, `message.send`
  - bridge process log
  - `bridge/data/sessions.json`

## P0 resilience
### Scenario: reconnect after socket close
- Priority: P0
- Pass criteria:
  - app transitions to disconnected state when socket closes
  - retry action reconnects successfully
  - existing session can still be resumed
- Evidence:
  - `adb logcat`
  - app UI screenshot showing disconnected then connected
  - bridge logs before/after reconnect

### Scenario: bridge restart during active session
- Priority: P0
- Pass criteria:
  - app surfaces disconnect state
  - after bridge restart, reconnect succeeds
  - most recent persisted session can be resumed
  - prior message history remains present
- Evidence:
  - bridge restart logs
  - `sessions.json` before/after restart
  - app logs for disconnect/reconnect

### Scenario: unreachable bridge / timeout
- Priority: P0
- Pass criteria:
  - connect attempt fails within bounded timeout
  - UI shows retryable error state
  - retry button is visible and functional after endpoint correction
- Evidence:
  - `adb logcat`
  - UI screenshot of error + retry

## P1 UX / validation
### Scenario: invalid QR payload
- Priority: P1
- Pass criteria:
  - malformed payload does not mutate endpoint/pairing unexpectedly
  - error text explains expected format
- Evidence:
  - app logs
  - UI screenshot

### Scenario: empty state / error state / retry UX
- Priority: P1
- Pass criteria:
  - empty chat shows onboarding guidance
  - connection failure shows retry action
  - retry recovers without app restart
- Evidence:
  - UI screenshots
  - app logs

### Scenario: approval / cancel flow
- Priority: P1
- Pass criteria:
  - approval card appears for approval-style prompt
  - approve/deny updates state correctly
  - cancel returns task to non-error idle flow for intentional cancel
- Evidence:
  - app logs
  - bridge logs
  - persisted approval/session state

## Release blocker rule
- Do not declare completion on happy-path alone.
- Completion requires **P0 blockers resolved** and evidence captured for the scenarios above.
