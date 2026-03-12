import { createAnalysis } from '@/app/actions';
import { NoteEditor } from '@/components/note-editor';
import { getProjects } from '@/lib/storage';

export default function NewAnalysisPage() {
  const projects = getProjects();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <form action={createAnalysis} className="space-y-6">
        <NoteEditor projectOptions={projects.map((project) => ({ id: project.id, name: project.name }))} />
        <button className="rounded-xl bg-violet-500 px-5 py-3 font-medium">Analyze note</button>
      </form>
    </main>
  );
}
