# DoneNote PRD

## 1. Product Overview
DoneNote is a lightweight AI SaaS for turning messy conversations, meeting notes, and client discussions into actionable summaries.

Users paste text or upload text-based notes, and DoneNote returns:
- concise summary
- action items
- owners
- deadlines
- follow-up questions

## 2. Problem
Knowledge workers, freelancers, and small teams regularly lose time converting raw conversations into organized work.
Current note apps store information, but do not reliably transform it into next actions.

## 3. Target Users
### Primary
- freelancers
- solo founders
- small startup leads
- consultants
- client-facing operators

### Early adopter profile
People who already copy/paste meeting notes into ChatGPT or Claude manually.

## 4. Value Proposition
DoneNote turns unstructured text into structured execution.
It is not just a summarizer; it is an action extraction tool.

## 5. MVP Scope
### In scope
1. Email/passwordless anonymous local demo mode
2. Create workspace/project
3. Paste raw text notes
4. Generate AI analysis with:
   - summary
   - action items
   - owners
   - deadlines
   - follow-up questions
5. Save result history
6. Browse previous notes/results

### Out of scope for v1
- team collaboration
- billing
- real auth provider
- integrations (Notion/Slack/Telegram)
- audio transcription
- file types beyond text/markdown initially

## 6. Core User Flow
1. User lands on homepage
2. User clicks “Try demo”
3. User creates/selects a project
4. User pastes meeting/client notes
5. User clicks “Analyze”
6. User receives structured output
7. User can save and revisit the result

## 7. Key Screens
1. Landing page
2. Dashboard / projects list
3. New note analysis page
4. Result detail/history page

## 8. Functional Requirements
### Project management
- user can create a project with title and description
- user can view all projects

### Note input
- user can enter title
- user can paste raw note text
- validation for empty input

### AI analysis
- system generates structured JSON output:
  - summary
  - actionItems[]
  - followUpQuestions[]
- each action item contains:
  - text
  - owner (optional)
  - deadline (optional)
  - priority (optional)

### Persistence
- project saved locally in JSON for MVP
- note and analysis saved locally in JSON for MVP

## 9. Non-Functional Requirements
- simple, fast UI
- mobile-friendly responsive layout
- understandable empty states
- no hard dependency on paid APIs for local demo mode

## 10. MVP Technical Approach
### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS

### Backend
- Next.js route handlers / server actions
- file-based JSON storage for MVP

### AI layer
- abstraction interface
- local mock analyzer by default
- real LLM provider can be plugged in later
- edge-AI preview layer in browser for hardware-aware preprocessing

### Edge AI / WebGPU Direction
DoneNote will evolve into a hybrid AI app:
- local browser preprocessing for sensitive or latency-critical tasks
- WebGPU acceleration where supported
- cloud refinement for final structured output

Planned edge features:
1. local PII detection and masking before upload
2. local action/owner/deadline candidate extraction
3. local draft summary before server refinement
4. fallback to CPU or server-only mode when WebGPU is unavailable

## 11. Success Metrics
### Week 1
- app runs locally
- can create project, analyze note, save result

### Month 1
- 10 beta users
- 30+ analyses completed
- 3 strong pain-point interviews

## 12. Risks
- generic summarizer positioning may be weak
- users may prefer direct ChatGPT usage unless workflow is smoother
- action extraction quality must feel useful even in mock mode

## 13. Future Roadmap
- LLM provider integration
- Notion/Slack/Telegram export
- shared workspace
- audio upload + transcription
- recurring daily brief
- billing and subscriptions
