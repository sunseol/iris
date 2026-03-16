import { InMemoryOpenCodeAdapter } from './stub-adapter.js';
import { ProcessBackedOpenCodeAdapter } from './runtime-adapter.js';

export function createAdapter() {
  const mode = process.env.OPENCODE_BRIDGE_MODE || 'process';
  if (mode === 'process') {
    return new ProcessBackedOpenCodeAdapter();
  }
  return new InMemoryOpenCodeAdapter();
}
