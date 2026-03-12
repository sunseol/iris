# DoneNote Edge AI / WebGPU Architecture

## Goal
Use on-device browser hardware acceleration (WebGPU where available) to process sensitive or latency-critical tasks before optional cloud processing.

## Product Positioning
DoneNote is a hybrid AI note organizer:
- local-first for sensitive preprocessing
- cloud-assisted for high-quality final structuring
- graceful fallback to CPU/server-only mode

## Core Edge AI Features
### 1. Private Prep
Before sending text to the server, run local preprocessing in the browser:
- PII detection
- masking/redaction suggestions
- optional client-side sanitization

### 2. Live Extraction
While the user types or pastes content, run local extraction for:
- action item candidates
- owner candidates
- deadline/date candidates
- decision/risk/question highlights

### 3. Hybrid Summary
- local fast draft summary
- server-side final structured output

## Execution Modes
### Cloud
Everything analyzed on server.

### Hybrid
- local preprocessing and draft generation
- final result refinement on server

### Local-first
- local PII masking required before upload
- reduced server payload

## Browser Capability Detection
DoneNote should detect:
- WebGPU availability
- memory pressure
- device class hints
- fallback availability (WASM/CPU)

## Suggested Pipeline
1. User inputs raw notes
2. Client runs capability detection
3. Client runs local preprocessors
4. UI shows quick extracted hints
5. Client submits either:
   - original note, or
   - masked note + extracted metadata
6. Server returns normalized final structure

## Fallback Strategy
- WebGPU -> preferred
- WASM / CPU local fallback -> acceptable
- server-only -> always available fallback

## Security / Privacy Notes
- clearly label when local mode is active
- clearly label when raw content is sent to server
- give users a toggle for masking before upload

## Future Technical Options
- transformers.js
- WebLLM
- ONNX Runtime Web
- custom regex/rule extraction before model inference
