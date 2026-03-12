import { NextResponse } from "next/server";

type IdeateRequest = {
  productIdea?: string;
  targetUsers?: string;
  constraints?: string;
};

function compact(input: string) {
  return input.trim().replace(/\s+/g, " ");
}

function parseCsv(text: string) {
  return text
    .split(/[;,\n]/)
    .map((v) => compact(v))
    .filter(Boolean);
}

export async function POST(req: Request) {
  const body = (await req.json()) as IdeateRequest;

  const productIdea = compact(body.productIdea ?? "AI와 협업하는 개발기획 플랫폼");
  const users = parseCsv(body.targetUsers ?? "1인 개발자, PM, 스타트업 팀");
  const constraints = parseCsv(body.constraints ?? "2주 MVP, 웹 우선, 비용 최소화");

  const userGroup = users[0] ?? "프로덕트 팀";
  const firstConstraint = constraints[0] ?? "짧은 개발 기간";

  const response = {
    vision: `${userGroup}이(가) 아이디어를 빠르게 MVP로 연결하도록 돕는 ${productIdea}`,
    problem: [
      "아이디어-요구사항-작업 분해가 분절되어 실행 속도가 느림",
      "기획 문서와 개발 태스크가 동기화되지 않음",
      `${firstConstraint} 환경에서 우선순위 판단이 어려움`,
    ],
    successMetrics: [
      "아이디어 입력 후 10분 내 PRD 초안 생성",
      "요구사항당 실행 태스크 자동 분해율 80%+",
      "기획-개발 핸드오프 시간 50% 단축",
    ],
    mvpScope: [
      "프로젝트 생성 + 기획 캔버스",
      "AI 아이디어 확장(비전/문제/지표/기능/로드맵)",
      "칸반 보드 기반 실행 관리(To Do / In Progress / Done)",
      "요구사항을 개발 태스크로 자동 생성",
      "결과 리포트 내보내기(Markdown)",
    ],
    roadmap: [
      {
        phase: "Phase 1 · MVP (0~2주)",
        items: [
          "아이디어 입력 폼 + AI 기획 생성",
          "기능 백로그 자동 생성",
          "간단한 칸반 보드와 상태 변경",
        ],
      },
      {
        phase: "Phase 2 · 팀 협업 (3~6주)",
        items: [
          "공동 편집 및 댓글",
          "역할 기반 권한",
          "작업 히스토리/감사 로그",
        ],
      },
      {
        phase: "Phase 3 · 코드 연동 (7주+)",
        items: [
          "GitHub 이슈/PR 동기화",
          "코드 생성 에이전트 연결",
          "배포 파이프라인 템플릿",
        ],
      },
    ],
    architecture: {
      frontend: "Next.js App Router + React + Tailwind",
      backend: "Next.js Route Handler (향후 BFF 확장)",
      state: "React client state (향후 DB: Postgres/Prisma)",
      deployment: "Vercel 권장",
    },
  };

  return NextResponse.json(response);
}
