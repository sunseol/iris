'use client';

import { EdgeAIPanel } from '@/components/edge-ai-panel';
import { useState } from 'react';

const initialText = `Client call summary\n- Move homepage launch to next Thursday\n- Mina updates hero copy by Wednesday\n- Jae confirms analytics event tracking\n- Need follow-up on pricing table revisions`;

export function NoteEditor({ projectOptions }: { projectOptions: { id: string; name: string }[] }) {
  const [rawText, setRawText] = useState(initialText);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">New analysis</h1>
          <p className="mt-1 text-sm text-zinc-400">Paste raw notes and turn them into structured next steps.</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-2 block text-sm text-zinc-300">Project</label>
            <select name="projectId" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none">
              <option value="">No project / use first project</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Note title</label>
            <input name="title" required placeholder="Weekly client sync" className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 outline-none" />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-300">Raw text</label>
            <textarea
              name="rawText"
              required
              rows={14}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 font-mono text-sm outline-none"
            />
          </div>
        </div>
      </div>

      <EdgeAIPanel rawText={rawText} />
    </div>
  );
}
