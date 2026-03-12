import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_PATH = process.env.OPENCODE_BRIDGE_STATE_PATH || new URL('../data/sessions.json', import.meta.url);

function resolvePath(input) {
  if (input instanceof URL) return fileURLToPath(input);
  return input;
}

export class SessionStore {
  constructor(file = DEFAULT_PATH) {
    this.file = resolvePath(file);
  }

  load() {
    try {
      const raw = readFileSync(this.file, 'utf8');
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.sessions) ? parsed.sessions : [];
    } catch {
      return [];
    }
  }

  save(sessions) {
    mkdirSync(dirname(this.file), { recursive: true });
    writeFileSync(this.file, JSON.stringify({ sessions }, null, 2));
  }
}
