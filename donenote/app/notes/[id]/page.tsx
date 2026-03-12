import { getNotes, getProjects } from '@/lib/storage';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function NoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notes = getNotes();
  const projects = getProjects();
  const note = notes.find((item) => item.id === id);

  if (!note) notFound();

  const project = projects.find((item) => item.id === note.projectId);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-zinc-400">← Back to dashboard</Link>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Raw note</p>
            <h1 className="mt-2 text-2xl font-bold">{note.title}</h1>
            <p className="mt-2 text-sm text-zinc-400">{project?.name ?? 'No project'}</p>
          </div>
          <pre className="whitespace-pre-wrap text-sm text-zinc-300">{note.rawText}</pre>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-5">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Analysis</p>
            <h2 className="mt-2 text-xl font-semibold">Structured output</h2>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-zinc-300">Summary</h3>
            <p className="text-sm text-zinc-400">{note.result.summary}</p>
          </div>

          <div className="mb-6">
            <h3 className="mb-2 text-sm font-semibold text-zinc-300">Action items</h3>
            <ul className="space-y-3">
              {note.result.actionItems.map((item, idx) => (
                <li key={idx} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
                  <div>{item.text}</div>
                  <div className="mt-2 text-xs text-zinc-500">Priority: {item.priority ?? 'unspecified'}</div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-zinc-300">Follow-up questions</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              {note.result.followUpQuestions.map((question, idx) => (
                <li key={idx}>• {question}</li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
