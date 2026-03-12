export type EdgeCapability = {
  webgpu: boolean;
  mode: 'cloud' | 'hybrid' | 'local-first';
  accelerationLabel: string;
};

export type LocalExtractionPreview = {
  piiMatches: string[];
  actionCandidates: string[];
  ownerCandidates: string[];
  deadlineCandidates: string[];
};

export function detectEdgeCapability(): EdgeCapability {
  if (typeof navigator === 'undefined') {
    return { webgpu: false, mode: 'cloud', accelerationLabel: 'Server only' };
  }

  const hasWebGPU = typeof (navigator as Navigator & { gpu?: unknown }).gpu !== 'undefined';

  return {
    webgpu: hasWebGPU,
    mode: hasWebGPU ? 'hybrid' : 'cloud',
    accelerationLabel: hasWebGPU ? 'WebGPU available' : 'CPU / server fallback',
  };
}

export function localExtractionPreview(rawText: string): LocalExtractionPreview {
  const lines = rawText.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const piiMatches = Array.from(rawText.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|\b\d{2,4}[- ]?\d{3,4}[- ]?\d{4}\b/gi)).map((m) => m[0]);
  const actionCandidates = lines.filter((line) => /todo|action|follow up|next|해야|할 일|담당|fix|send|review/i.test(line)).slice(0, 6);
  const ownerCandidates = lines.filter((line) => /owner|담당|by\s+[A-Za-z가-힣]+|@[A-Za-z0-9_-]+/i.test(line)).slice(0, 6);
  const deadlineCandidates = lines.filter((line) => /today|tomorrow|next|monday|tuesday|wednesday|thursday|friday|이번 주|다음 주|까지|deadline|due/i.test(line)).slice(0, 6);

  return {
    piiMatches,
    actionCandidates,
    ownerCandidates,
    deadlineCandidates,
  };
}
