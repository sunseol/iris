import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <section className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-violet-300">AI note organizer</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">Turn messy conversations into clear next actions.</h1>
          <p className="mb-8 max-w-xl text-lg text-zinc-300">
            DoneNote helps freelancers and small teams convert meeting notes, client conversations, and raw thoughts into summaries,
            action items, and follow-up questions.
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard" className="rounded-xl bg-violet-500 px-5 py-3 font-medium text-white">Open dashboard</Link>
            <Link href="/new" className="rounded-xl border border-zinc-700 px-5 py-3 font-medium text-zinc-200">Try analysis</Link>
          </div>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl shadow-black/20">
          <div className="mb-4 text-sm text-zinc-400">Example output</div>
          <div className="space-y-4">
            <div>
              <h2 className="mb-2 text-sm font-semibold text-zinc-300">Summary</h2>
              <p className="text-sm text-zinc-400">Client wants launch moved to next Thursday, homepage copy revised, and analytics reviewed before publish.</p>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-semibold text-zinc-300">Action items</h2>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>• Revise homepage copy</li>
                <li>• Confirm analytics events</li>
                <li>• Send updated launch timeline</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
