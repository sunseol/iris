# Bridge Architecture Draft

Status: draft

## Product Shape
Android-first remote companion for controlling OpenCode running on a host machine.

## High-Level Components
### 1. Android App
Responsibilities:
- pairing / connection
- chat timeline
- task status display
- cancel action
- recent sessions
- restore-first relaunch flow

Suggested stack:
- Expo
- React Native
- TypeScript
- Expo Router
- AsyncStorage / SecureStore
- Expo-compatible QR scanner

### 2. Host Bridge
Responsibilities:
- launch or attach OpenCode runtime
- normalize runtime output into app events
- keep session state
- expose WebSocket API
- support reconnect and session restore metadata

Suggested stack:
- Node.js
- TypeScript
- ws
- zod for protocol schemas
- pty wrapper if necessary

### 3. Shared Protocol
Responsibilities:
- define event names and payload shapes
- decouple Android UI from OpenCode-specific output

Early event ideas:
- `session.create`
- `session.resume`
- `session.list`
- `message.send`
- `task.cancel`
- `message.delta`
- `task.status`
- `task.complete`
- `task.error`

### 4. Relay (Later)
Responsibilities:
- remote routing outside LAN
- session pairing across networks
- optional self-hosted mode

## MVP Shape
Initial MVP should avoid relay complexity and target:
- local network access
- or Tailscale / tunnel-assisted access
- no git feature surface
- no persistent background connection requirement
- foreground restore to recent session instead

## Main Unknown
The architecture depends on how well OpenCode can be adapted into a stable event source.
If output is only TUI-oriented, the bridge may need PTY scraping and heuristic event synthesis.

## Next Action
Finalize Phase 1 verdict before locking the bridge runtime strategy.
