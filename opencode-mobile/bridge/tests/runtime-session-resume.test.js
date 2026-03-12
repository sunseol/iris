import test from 'node:test';
import assert from 'node:assert/strict';
import { ProcessBackedOpenCodeAdapter } from '../src/runtime-adapter.js';

test('session metadata can carry runtime session id for resume path', () => {
  const adapter = new ProcessBackedOpenCodeAdapter({ command: 'opencode', args: ['run', '--format', 'json'] });
  const session = adapter.createSession('/tmp');
  const updated = adapter.requireSession(session.id);
  updated.runtimeSessionID = 'ses_runtime_1';
  assert.equal(updated.runtimeSessionID, 'ses_runtime_1');
});
