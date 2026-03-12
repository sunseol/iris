# AI 협업 개발 기획 플랫폼 — 완성 보고서

## 1) 구현 목표
- 아이디어 → AI 기획 제안 → 실행 태스크 전환까지 한 번에 처리
- Next.js + React 기반 MVP 완성본 제공

## 2) 기술 스택
- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- Next Route Handler (`/api/ideate`) for AI-planning simulation

## 3) 핵심 기능
1. **아이디어 입력 폼**
   - 제품 아이디어 / 타겟 사용자 / 제약 조건 입력
2. **AI 기획 생성**
   - 비전, 문제 정의, 성공 지표, MVP 범위, 로드맵, 아키텍처 자동 생성
3. **실행 칸반 보드**
   - 생성된 MVP 항목을 To Do / In Progress / Done으로 이동
4. **로드맵 시각화**
   - Phase 1~3 단계별 계획 표시

## 4) 주요 파일 구조
- `src/app/page.tsx` : 메인 UI 및 상태 관리
- `src/app/api/ideate/route.ts` : 기획 생성 API
- `src/app/layout.tsx` : 메타데이터/언어 설정

## 5) 실행 방법
```bash
cd ai-planning-platform
npm install
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

## 6) 확장 제안
- OpenAI/Claude API 연결로 실제 LLM 기획 생성
- 인증/권한(Role-based)
- Postgres + Prisma 연동
- GitHub 이슈/PR 자동 동기화
- 실시간 협업(코멘트, 활동 로그)
