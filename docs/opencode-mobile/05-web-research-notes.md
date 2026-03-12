# Web Research Notes

Status: draft

## Sources Checked
1. GitHub repository page: `https://github.com/anomalyco/opencode` (fetched via redirect from `https://github.com/sst/opencode`)
2. Product site: `https://opencode.ai`

## Confirmed Findings
### 1. OpenCode positions itself as a terminal-first coding agent
Evidence:
- GitHub README excerpt describes OpenCode as an open source AI coding agent with a strong TUI focus.

Why it matters:
- Confirms interactive terminal usage exists.
- Implies PTY-based wrapping may be a valid fallback.

### 2. OpenCode has a client/server architecture
Evidence:
- GitHub README excerpt explicitly says: “A client/server architecture. This, for example, can allow OpenCode to run on your computer while you drive it remotely from a mobile app, meaning that the TUI frontend is just one of the possible clients.”

Why it matters:
- This is the strongest public signal that an Android remote-control companion is architecturally aligned with OpenCode’s direction.
- Suggests a future third-party bridge may be cleaner than pure PTY scraping if internal protocol access is possible.

### 3. OpenCode supports multiple sessions
Evidence:
- opencode.ai homepage explicitly lists “Multi-session Start multiple agents in parallel on the same project”.

Why it matters:
- Important for a mobile companion app because session switching is a core mobile use case.

### 4. Session concept likely exists publicly
Evidence:
- opencode.ai homepage says “Share links Share a link to any session for reference or to debug”.

Why it matters:
- Strong indication that sessions are addressable entities, not just ephemeral terminal output.

### 5. Permission/approval concepts exist
Evidence:
- GitHub README says the built-in `plan` agent is read-only and asks permission before running bash commands.

Why it matters:
- Indicates approval UX is already part of the product model.
- Good fit for future mobile approval controls.

## Unconfirmed / Missing From Public Web Pages
- exact CLI subcommands
- machine-readable / JSON output mode
n- external protocol documentation
- session resume semantics
- cancellation behavior
- persistence/storage format
- approval API details
- whether PTY is required for third-party integrations

## Preliminary Verdict From Web Research Alone
### Overall
OpenCode appears **promising** for a mobile companion project.

### Confidence
Medium.

### Reason
The product-level architecture strongly supports remote/mobile control, but implementation-level details are still missing without CLI or code-level inspection.

### Interim Rating
**B (fit with adapter cost)**, pending CLI/runtime verification.

## Recommended Next Step
Inspect docs/code/help output to determine whether the client/server interface is publicly accessible or whether a PTY adapter is required for MVP.
