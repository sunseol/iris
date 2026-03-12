# Phase 1 Technical Validation Spec

Status: draft

## Purpose
Determine whether OpenCode can be wrapped by a host bridge and exposed safely and usefully to an Android companion app.

This phase does **not** build the Android app yet.
It validates whether OpenCode provides a sufficiently controllable runtime interface.

## Primary Questions
1. How can OpenCode be executed?
2. Does it support non-interactive or long-lived session modes?
3. Is output structured, streamable, or only terminal-oriented?
4. Can tasks be cancelled, resumed, or controlled externally?
5. Can approvals be detected and mediated through a mobile bridge?
6. Can results be converted into a stable mobile-friendly event model?

## Validation Scope
### In scope
- CLI execution model
- PTY requirement 여부
- stdout/stderr structure
- session persistence and recovery
- approval / interruption / retry behavior
- workspace targeting
- feasibility of a Node-based bridge

### Out of scope
- Android UI implementation
- relay hosting
- production-grade auth/security
- git feature design
- push notifications

## Validation Questions in Detail
### Q1. Execution Model
- Is there a one-shot command mode?
- Is there a persistent interactive mode?
- Can a workspace/directory be specified?
- Can prompts be sent programmatically?

### Q2. Output Model
- Is there JSON output?
- Is there an event stream?
- Are task state boundaries detectable?
- Are tool calls or file changes observable?

### Q3. Session Model
- Is there a session or thread identifier?
- Can a session be resumed?
- Can multiple sessions coexist?
- Is state persisted to disk?

### Q4. Control Model
- Can a running task be cancelled?
- Can approvals be externally answered?
- Is there an auto-approve mode?
- Are failures distinguishable from normal completion?

### Q5. Bridge Feasibility
- Can a Node bridge safely wrap it?
- Is PTY scraping enough?
- Is protocol normalization realistic?
- Can the runtime be made stable enough for mobile remote control?

## Verdict Levels
### A — Strong fit
- structured output and stable session control
- easy bridge implementation
- Android MVP should be straightforward

### B — Fit with adapter cost
- usable CLI, but stdout/PTY parsing needed
- still realistic for MVP
- maintenance cost moderate

### C — Possible but fragile
- mostly terminal-only
- weak session/control model
- demo possible, productization risky

### D — Not practical right now
- no stable control path
- no session model
- parsing too brittle
- rethink runtime or product scope

## Minimum Conditions for MVP Continuation
At least 4 of the following should be true:
1. OpenCode can target a workspace
2. Prompts can be sent programmatically
3. Output can be streamed or approximated as stream events
4. completion/failure can be detected
5. running tasks can be interrupted
6. some session/log persistence exists

## Deliverables
1. capability matrix
2. test scenario log
3. bridge feasibility verdict
4. recommended MVP execution model

## Evidence Rules
- Mark each item as `confirmed`, `assumed`, or `blocked`
- Include exact command or source reference when possible
- Prefer short raw output excerpts over paraphrase when needed

## Next Action
Populate the capability matrix and define command-level tests.
