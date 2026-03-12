# OpenCode Mobile App

Expo React Native client for the OpenCode Mobile MVP.

## Current UI scope
### Chat screen
- simple message timeline
- pending approvals block
- prompt composer
- minimal active-session header

### Settings screen
- bridge endpoint connect form
- connection status + actions
- host status / runtime info card
- recent sessions list
- pairing code field for QR onboarding
- real camera-based QR scanner flow
- permission-denied / malformed-payload guidance for QR onboarding
- simulated QR import hook
- restore-first local persistence hooks

## Notes
- The chat screen is intentionally kept simple, like a normal chat surface.
- Connection, pairing, host health, and runtime controls are grouped under Settings.
- Approval actions call `approval.respond`, but the runtime-side approval model is still heuristic until the real OpenCode CLI is calibrated.
- For emulator verification, an autotest lane can be enabled with:
  - `EXPO_PUBLIC_AUTOTEST_MODE=1`
  - `EXPO_PUBLIC_AUTOTEST_BRIDGE=ws://10.0.2.2:7360`
  - `EXPO_PUBLIC_AUTOTEST_MESSAGE=hi`
