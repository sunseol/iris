"use client";

import { useMemo, useState } from "react";

type PlanResponse = {
  vision: string;
  problem: string[];
  successMetrics: string[];
  mvpScope: string[];
  roadmap: { phase: string; items: string[] }[];
  architecture: {
    frontend: string;
    backend: string;
    state: string;
    deployment: string;
  };
};

type BoardColumn = "backlog" | "doing" | "done";

type Task = {
  id: string;
  title: string;
  owner: string;
  priority: "P0" | "P1" | "P2";
  column: BoardColumn;
};

const columnLabels: Record<BoardColumn, string> = {
  backlog: "To Do",
  doing: "In Progress",
  done: "Done",
};

const priorityStyle: Record<Task["priority"], string> = {
  P0: "bg-red-100 text-red-700",
  P1: "bg-amber-100 text-amber-700",
  P2: "bg-emerald-100 text-emerald-700",
};

function toTask(scope: string, idx: number): Task {
  return {
    id: `task-${idx + 1}`,
    title: `${scope} 구현`,
    owner: idx % 2 === 0 ? "FE" : "BE",
    priority: idx === 0 ? "P0" : idx < 3 ? "P1" : "P2",
    column: "backlog",
  };
}

export default function Home() {
  const [idea, setIdea] = useState("AI와 함께 제품 기획부터 개발 실행까지 연결하는 플랫폼");
  const [users, setUsers] = useState("1인 개발자, PM, 스타트업 팀");
  const [constraints, setConstraints] = useState("2주 MVP, 소수 인원, 웹 우선");

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);

  const grouped = useMemo(
    () => ({
      backlog: tasks.filter((t) => t.column === "backlog"),
      doing: tasks.filter((t) => t.column === "doing"),
      done: tasks.filter((t) => t.column === "done"),
    }),
    [tasks],
  );

  const runIdeation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIdea: idea,
          targetUsers: users,
          constraints,
        }),
      });

      if (!res.ok) {
        throw new Error("AI 기획 생성에 실패했습니다.");
      }

      const data = (await res.json()) as PlanResponse;
      setPlan(data);
      setTasks(data.mvpScope.map(toTask));
    } catch (e) {
      const message = e instanceof Error ? e.message : "알 수 없는 오류";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const moveTask = (id: string, next: BoardColumn) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, column: next } : t)));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-8">
        <header className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-indigo-600">AI Product Planning Platform</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">기획과 개발을 한 화면에서</h1>
          <p className="mt-2 text-slate-600">
            아이디어를 입력하면 AI가 PRD/MVP/로드맵을 만들고, 즉시 실행 가능한 개발 태스크로 변환합니다.
          </p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">1) 아이디어 입력</h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">제품 아이디어</span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">타겟 사용자</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
                  value={users}
                  onChange={(e) => setUsers(e.target.value)}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium">제약 조건</span>
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-indigo-200 focus:ring"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                />
              </label>

              <button
                onClick={runIdeation}
                disabled={loading}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {loading ? "AI가 기획 중..." : "2) AI 기획 생성"}
              </button>

              {error && <p className="text-sm font-medium text-red-600">{error}</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">3) 기획 요약 리포트</h2>
            {!plan ? (
              <p className="mt-4 text-slate-500">생성 버튼을 누르면 AI가 비전/문제/지표/MVP를 제안합니다.</p>
            ) : (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <p className="font-semibold">비전</p>
                  <p className="text-slate-700">{plan.vision}</p>
                </div>
                <div>
                  <p className="font-semibold">핵심 문제</p>
                  <ul className="list-disc pl-5 text-slate-700">
                    {plan.problem.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">성공 지표</p>
                  <ul className="list-disc pl-5 text-slate-700">
                    {plan.successMetrics.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-semibold">아키텍처</p>
                  <ul className="space-y-1 text-slate-700">
                    <li>FE: {plan.architecture.frontend}</li>
                    <li>BE: {plan.architecture.backend}</li>
                    <li>State: {plan.architecture.state}</li>
                    <li>Deploy: {plan.architecture.deployment}</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-xl font-semibold">4) 실행 칸반 보드</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(Object.keys(columnLabels) as BoardColumn[]).map((col) => (
              <div key={col} className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <h3 className="mb-3 font-semibold">{columnLabels[col]}</h3>
                <div className="space-y-2">
                  {grouped[col].map((task) => (
                    <article key={task.id} className="rounded-lg bg-white p-3 ring-1 ring-slate-200">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{task.title}</p>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${priorityStyle[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">Owner: {task.owner}</p>
                      <div className="mt-3 flex gap-2 text-xs">
                        {col !== "backlog" && (
                          <button
                            className="rounded bg-slate-200 px-2 py-1 hover:bg-slate-300"
                            onClick={() => moveTask(task.id, col === "done" ? "doing" : "backlog")}
                          >
                            이전
                          </button>
                        )}
                        {col !== "done" && (
                          <button
                            className="rounded bg-indigo-100 px-2 py-1 text-indigo-700 hover:bg-indigo-200"
                            onClick={() => moveTask(task.id, col === "backlog" ? "doing" : "done")}
                          >
                            다음
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                  {grouped[col].length === 0 && <p className="text-sm text-slate-400">작업 없음</p>}
                </div>
              </div>
            ))}
          </div>
        </section>

        {plan && (
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold">5) 단계별 로드맵</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {plan.roadmap.map((phase) => (
                <div key={phase.phase} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <h3 className="font-semibold">{phase.phase}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                    {phase.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
