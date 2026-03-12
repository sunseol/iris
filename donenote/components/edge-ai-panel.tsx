'use client';

import { detectEdgeCapability, localExtractionPreview } from '@/lib/edge-ai';
import { useMemo } from 'react';

export function EdgeAIPanel({ rawText }: { rawText: string }) {
  const capability = useMemo(() => detectEdgeCapability(), []);
  const preview = useMemo(() => localExtractionPreview(rawText), [rawText]);

  return (
    <div className="rounded-2xl border border-cyan-900/60 bg-cyan-950/20 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Edge AI</h3>
          <p className="mt-1 text-sm text-zinc-400">Local preprocessing and hardware-aware analysis preview.</p>
        </div>
        <span className="rounded-full border border-cyan-800 px-3 py-1 text-xs text-cyan-200">{capability.accelerationLabel}</span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-2 text-sm font-medium text-zinc-200">Suggested mode</div>
          <div className="text-sm text-zinc-400">{capability.mode}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-2 text-sm font-medium text-zinc-200">Potential PII matches</div>
          <div className="text-sm text-zinc-400">{preview.piiMatches.length ? preview.piiMatches.join(', ') : 'No obvious matches detected'}</div>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-2 text-sm font-medium text-zinc-200">Action candidates</div>
          <ul className="space-y-1 text-sm text-zinc-400">
            {(preview.actionCandidates.length ? preview.actionCandidates : ['No local action candidates yet']).map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-2 text-sm font-medium text-zinc-200">Deadline / owner hints</div>
          <ul className="space-y-1 text-sm text-zinc-400">
            {[(preview.ownerCandidates[0] ?? 'No owner hint'), (preview.deadlineCandidates[0] ?? 'No deadline hint')].map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
