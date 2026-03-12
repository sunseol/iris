# OpenCode Test Scenarios

Status: draft

## Purpose
Define the exact command-level experiments needed to fill the capability matrix.

## Test Recording Format
For each test, record:
- command
- environment/workdir
- raw output excerpt
- interpretation
- matrix rows affected

---

## T1. Basic CLI discovery
### Goal
Identify top-level CLI surface and available subcommands/options.

### Commands
- `opencode --help`
- `opencode help`

### Expected Learnings
- presence of run/chat/session commands
- flags for JSON, quiet, non-interactive, model, workspace, approval

### Matrix Impact
- Execution / Output / Control

---

## T2. One-shot execution check
### Goal
Determine whether OpenCode can execute a prompt without a full interactive TUI loop.

### Candidate Commands
- `opencode run --help`
- `opencode exec --help`
- `opencode chat --help`
- or closest equivalent from help output

### Success Criteria
- prompt can be passed via CLI flag or arg
- process exits when complete

### Failure Criteria
- only TUI/interactive boot path exists

### Matrix Impact
- Execution: one-shot mode
- Output: completion detection

---

## T3. Workspace targeting check
### Goal
Verify whether a working directory / project root can be set explicitly.

### Candidate Checks
- flags like `--cwd`, `--project`, `--workspace`
- running from a target directory and observing behavior

### Success Criteria
- runtime is scoped to a chosen directory predictably

### Matrix Impact
- Execution: workspace targeting

---

## T4. Structured output check
### Goal
Verify machine-readable output possibilities.

### Candidate Checks
- `--json`
- `--output json`
- `--format json`
- event/log flags

### Success Criteria
- output is parseable and stable enough for a bridge

### Fallback Outcome
- plain text only, but states still inferable

### Matrix Impact
- Output rows

---

## T5. Persistent session check
### Goal
Find whether OpenCode can sustain or resume an ongoing conversation.

### Checks
- session-related commands in help
- local storage paths or session identifiers in output
- resume flags or prior-thread references

### Success Criteria
- session can be reopened or meaningfully continued

### Matrix Impact
- Session rows

---

## T6. Cancellation check
### Goal
Determine whether an in-flight task can be interrupted safely.

### Method
- start a long-running task
- send SIGINT or equivalent control input
- inspect resulting state/output

### Success Criteria
- process stops cleanly and state is understandable

### Matrix Impact
- Control: cancellation

---

## T7. Approval behavior check
### Goal
Identify how approvals are presented and whether they can be bridged.

### Method
- trigger a task that should require file/system action
- inspect prompt/approval wording and I/O path

### Success Criteria
- approval request is observable and externally answerable

### Matrix Impact
- Control: approval rows

---

## T8. PTY dependency check
### Goal
See whether OpenCode behaves differently in non-PTY vs PTY environments.

### Method
- run a comparable command with and without PTY
- compare output stability and usability

### Success Criteria
- determine bridge runtime strategy

### Matrix Impact
- Bridge rows

---

## T9. Failure mode check
### Goal
Understand how OpenCode reports errors and incomplete runs.

### Method
- induce an invalid command or blocked action
- inspect stderr/stdout and exit code behavior

### Success Criteria
- bridge can detect failure state cleanly

### Matrix Impact
- Output: failure detectable
- Control: retry feasibility

---

## Phase 1 Completion Rule
Phase 1 is complete when:
- T1–T5 are executed
- at least one of T6–T8 is executed
- capability matrix has evidence for execution, output, and control
- a final A/B/C/D verdict is written

## Next Action
After these scenarios are run, write a one-page feasibility verdict and choose the MVP bridge strategy.
