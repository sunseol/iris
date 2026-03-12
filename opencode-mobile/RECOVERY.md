# OpenCode Mobile Recovery Workflow

## Bridge restart recovery
1. Start bridge with the same `OPENCODE_BRIDGE_STATE_PATH`.
2. Call `session.list`.
3. Select the desired session id.
4. Call `session.resume`.
5. Confirm recovered fields:
   - `runtimeSessionID`
   - `lastMessagePreview`
   - message history

## Runtime continuation
- If a bridge session already has `runtimeSessionID`, the bridge should prefer:
  - `opencode run --format json --session <runtimeSessionID> ...`
- If no runtime session id exists, fallback may use `--continue` when configured.

## Cancel recovery
- `task.cancel` should terminate the real OpenCode child process.
- After cancel, the session should return to `idle`.
- No lingering matching `opencode run --format json ...` process should remain.

## QR onboarding recovery
- If camera permission is denied, show guidance and allow manual endpoint/pairing input.
- If QR payload is malformed, do not overwrite existing endpoint/pairing values.
- Allow retry by reopening the scanner.
