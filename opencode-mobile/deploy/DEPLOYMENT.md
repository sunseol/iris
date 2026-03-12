# Deployment Notes

## Recommended packaging
For a single host Linux deployment, run the bridge as a `systemd` service.

Reference unit file:
- `deploy/opencode-mobile-bridge.service`

## Install steps
1. Copy the service file to `/etc/systemd/system/opencode-mobile-bridge.service`
2. Adjust paths, port, and environment variables if needed
3. Reload systemd:
   ```bash
   sudo systemctl daemon-reload
   ```
4. Enable + start:
   ```bash
   sudo systemctl enable --now opencode-mobile-bridge
   ```
5. Check logs:
   ```bash
   sudo journalctl -u opencode-mobile-bridge -f
   ```

## Required environment
- `PORT`
- `OPENCODE_BRIDGE_MODE=process`
- `OPENCODE_CMD=opencode`
- `OPENCODE_ARGS='run --format json'`
- `OPENCODE_BRIDGE_STATE_PATH`

## Recovery expectations
- Restart should preserve persisted session metadata and message history via `OPENCODE_BRIDGE_STATE_PATH`
- Mobile app can reconnect and call `session.list` / `session.resume`

## Caveats
- Approval is currently modeled as bridge-side consent derived from assistant text, not a proven native OpenCode approval API
- Real-device reconnect polish still needs validation
