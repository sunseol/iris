# Real OpenCode Adapter Notes

## Confirmed from public docs
- install package name: `opencode-ai`
- standard terminal entrypoint: run `opencode` inside the target project directory
- OpenCode has a client/server architecture conceptually
- multi-session support exists conceptually

## Current state
A generic process-backed adapter now exists in `runtime-adapter.js`.
It can:
- create mobile-visible sessions
- spawn a CLI process per session in the chosen workspace
- write prompts to stdin
- stream stdout back as `message.delta`
- convert line-end completions into `message.done`
- cancel via `SIGINT`
- persist session metadata for restore-first UX

## Remaining runtime-specific work
- discover exact OpenCode startup flags and subcommands
- verify whether PTY is required
- detect approvals vs normal assistant output
- detect task boundaries more accurately than newline heuristics
- support durable session restore across bridge restarts if OpenCode exposes it

## Likely integration paths
1. documented/native OpenCode server mode if accessible
2. CLI wrapper with structured output if available
3. PTY adapter as fallback
