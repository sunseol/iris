# OpenCode Capability Matrix

Status: draft

## Legend
- Status: confirmed / assumed / blocked / not-tested
- Verdict: good / acceptable / risky / failed

| Area | Question | Status | Verdict | Evidence | Notes |
|---|---|---:|---:|---|---|
| Execution | One-shot command mode exists | assumed | acceptable | GitHub README confirms terminal interface and CLI install, but no direct `run/exec` syntax confirmed from fetched pages | Needs CLI help verification |
| Execution | Persistent interactive mode exists | confirmed | good | GitHub README: focus on TUI; built-in agents switchable with Tab | Strong signal that interactive terminal mode exists |
| Execution | Workspace/directory can be targeted | assumed | acceptable | Product is a coding agent for terminal/project workflows; likely current-directory scoped, but not explicitly shown in fetched pages | Needs CLI/docs confirmation |
| Execution | Prompt can be sent programmatically | assumed | acceptable | GitHub README explicitly says client/server architecture can allow remote driving from a mobile app | Strong conceptual signal, but transport/protocol unknown |
| Output | JSON output supported | blocked | risky | No JSON or machine-readable output mention found in fetched README/site content | Requires CLI/docs inspection |
| Output | Stream/event output supported | assumed | acceptable | Client/server architecture implies event transport is plausible, but public docs excerpt does not expose protocol format | Needs docs/code check |
| Output | Completion detectable | assumed | acceptable | A remote client/server design likely needs task boundaries, but no explicit evidence in fetched pages | Needs real runtime inspection |
| Output | Failure detectable | assumed | acceptable | Likely via process exit/logging, but not documented in fetched sources | Needs runtime check |
| Output | Tool/file-change signals visible | blocked | risky | No evidence from fetched pages | Needs runtime/code inspection |
| Session | Session/thread identifier exists | assumed | acceptable | opencode.ai homepage mentions share links to any session for reference/debug | Suggests sessions exist as addressable entities |
| Session | Session can be resumed | blocked | risky | No direct resume evidence in fetched sources | Needs docs/runtime |
| Session | Multiple sessions possible | confirmed | good | opencode.ai homepage explicitly says multi-session support | Strong signal for mobile companion usefulness |
| Session | State persists to disk | blocked | risky | No storage-path or persistence detail found in fetched sources | Needs code/docs inspection |
| Control | Running task can be cancelled | blocked | risky | No fetched evidence | Likely possible in TUI, but unconfirmed |
| Control | Approval requests are detectable | assumed | acceptable | GitHub README says `plan` agent asks permission before running bash commands | Approval concept definitely exists |
| Control | Approval can be answered externally | assumed | acceptable | Client/server + mobile-remote concept suggests possible bridge mediation, but no explicit API evidence | Needs code/docs confirmation |
| Control | Auto-approve mode exists | blocked | risky | No explicit evidence in fetched pages | Needs CLI/docs inspection |
| Bridge | Node wrapper without PTY is possible | assumed | acceptable | GitHub README explicitly says client/server architecture exists and TUI is one possible client | Very promising if internal protocol is accessible |
| Bridge | PTY wrapper is sufficient | assumed | acceptable | If no public protocol is available, TUI/PTTY wrapping remains fallback | Likely viable for MVP, but brittle |
| Bridge | Mobile event normalization seems realistic | confirmed | good | GitHub README: OpenCode can run on your computer while you drive it remotely from a mobile app | Strong product-level evidence for this project direction |

## Preliminary Assumptions
- A PTY-based wrapper may be needed if OpenCode behaves like an interactive terminal agent.
- A first MVP can still work with streamed plain text if state boundaries are inferable.

## Web Findings Summary
Confirmed from fetched public pages:
- OpenCode is available as a terminal interface, desktop app, and IDE extension.
- OpenCode explicitly supports multi-session usage.
- OpenCode has a client/server architecture.
- OpenCode documentation/README explicitly states that it can run on your computer while being driven remotely from a mobile app.
- OpenCode exposes at least one permission-oriented mode via the built-in `plan` agent, which asks before running bash commands.

## Open Questions
1. Is there a machine-readable mode at all?
2. Does OpenCode expose approvals as protocol events or only as interactive prompts?
3. Can sessions be resumed after process restart?
4. How much CLI behavior changes when run non-interactively?
5. Is the public client/server interface accessible for third-party bridge apps?

## Exit Criteria
This document is ready for verdict when all `Execution`, `Output`, and `Control` rows have concrete evidence.

## Next Action
Run the test scenarios in `03-test-scenarios.md` and fill evidence column row by row.
