import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { ProcessBackedOpenCodeAdapter } from '../src/runtime-adapter.js';

test('cancel leaves proc managed until exit but marks session idle', () => {
  const adapter = new ProcessBackedOpenCodeAdapter({ command: 'opencode', args: ['run', '--format', 'json'] });
  const session = adapter.createSession('/tmp');
  const entry = adapter.sessions.get(session.id);
  entry.proc = spawn('sleep', ['30'], { detached: true, stdio: 'ignore' });
  adapter.cancel(session.id);
  assert.equal(entry.cancelRequested, true);
  assert.equal(adapter.requireSession(session.id).status, 'idle');
  try { process.kill(-entry.proc.pid, 'SIGTERM'); } catch {}
});
