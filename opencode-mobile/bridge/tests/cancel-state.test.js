import test from 'node:test';
import assert from 'node:assert/strict';
import { ProcessBackedOpenCodeAdapter } from '../src/runtime-adapter.js';

test('cancel marks cancelRequested before process exit handling', () => {
  const adapter = new ProcessBackedOpenCodeAdapter({ command: 'opencode', args: ['run', '--format', 'json'] });
  const session = adapter.createSession('/tmp');
  const entry = adapter.sessions.get(session.id);
  entry.proc = { killed: false, pid: process.pid, kill() {} };
  adapter.cancel(session.id);
  assert.equal(entry.cancelRequested, true);
});
