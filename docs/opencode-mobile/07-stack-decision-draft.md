# Stack Decision Draft

Status: draft

## Decision Summary
The first MVP will target **Android-first via Expo (React Native)** instead of Kotlin/Jetpack Compose.

## Confirmed Product Constraints
- git features are out of scope
- no persistent background connection for MVP
- instead, app relaunch should restore and redirect to the most recent connection/session when possible
- the host runtime remains OpenCode running on a separate machine
- the app acts as a remote companion, not a local coding runtime

## Selected Stack
### Mobile App
- Expo
- React Native
- TypeScript
- Expo Router
- AsyncStorage for recent session/navigation state
- SecureStore for pairing token / sensitive connection data
- WebSocket client for bridge communication
- QR scanning through Expo-compatible module

### Host Bridge
- Node.js
- TypeScript
- ws for WebSocket transport
- zod for protocol validation
- adapter layer for OpenCode runtime
- PTY wrapper as fallback if direct server interface is insufficient

### App ↔ Bridge Protocol
- JSON-RPC style requests
- event/notification messages for streaming output and task updates

### Bridge ↔ OpenCode
Priority order:
1. Use `opencode serve` / `opencode web` / documented server mode if accessible
2. Fall back to PTY/CLI adapter if server surface is not sufficient for third-party integration

## Why Expo
### Pros
- fastest path to Android MVP
- good fit for chat-style UI
- sufficient for WebSocket + QR + restore flow
- preserves future iOS option if desired

### Limitations Accepted For MVP
- no long-running background socket expectations
- no advanced device-native network discovery in MVP
- reconnect model is foreground restore, not persistent background service

## UX Decision
Instead of background continuity, the MVP will support:
- recent host restore
- recent session restore
- automatic redirect to the last active session when app restarts and the host is reachable

## Deferred Decisions
- relay server
- push notifications
- multi-host support
- file attachments
- approval UX details

## Next Action
Update protocol and MVP PRD to match this Expo + restore-first scope.
