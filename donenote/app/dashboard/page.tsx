import { createProject } from '@/app/actions';
import { getNotes, getProjects } from '@/lib/storage';
import Link from 'next/link';

export default function DashboardPage() {
  const projects = getProjects();
  const notes = getNotes();

  return (
    <main className="mx-auto grid max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr]">
      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-400">Projects and recently analyzed notes.</p>
          </div>
          <Link href="/new" className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium">New analysis</Link>
        </div>

        <div className="mb-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Projects</h2>
          <div className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-zinc-400">No projects yet. Create your first one on the right.</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <div className="font-medium">{project.name}</div>
                  {project.description ? <div className="mt-1 text-sm text-zinc-400">{project.description}</div> : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Recent notes</h2>
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-sm text-zinc-400">No analyses yet.</p>
            ) : (
              notes.map((note) => (
                <Link key={note.id} href={`/notes/${note.id}`} className="block rounded-xl border border-zinc-800 bg-zinc-950 p-4 transition hover:border-zinc-700">
                  <div className="font-medium">{note.title}</div>
                  <div className="mt-1 line-clamp-2 text-sm text-zinc-400">{note.result.summary}</div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      <aside>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <h2 className="mb-4 text-lg font-semibold">Create project</h2>
          <form action={createProject} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Project name</label>
              <input name="name" required className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-zinc-300">Description</label>
              <textarea name="description" rows={4} className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" />
            </div>
            <button className="w-full rounded-xl bg-violet-500 px-4 py-3 font-medium">Save project</button>
          </form>
        </div>
      </aside>
    </main>
  );
}
