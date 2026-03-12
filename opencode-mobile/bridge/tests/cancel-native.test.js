import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { ProcessBackedOpenCodeAdapter } from '../src/runtime-adapter.js';

test('cancel leaves proc managed until exit but marks session idle', async () => {
  const adapter = new ProcessBackedOpenCodeAdapter({ command: 'opencode', args: ['run', '--format', 'json'] });
  const session = adapter.createSession('/tmp');
  const entry = adapter.sessions.get(session.id);
  entry.proc = spawn(process.execPath, ['-e', 'setInterval(() => {}, 30000)'], { detached: true, stdio: 'ignore' });
  adapter.cancel(session.id);
  assert.equal(entry.cancelRequested, true);
  assert.equal(adapter.requireSession(session.id).status, 'idle');

  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('child process did not exit after cancel')), 5000);
    entry.proc.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    entry.proc.once('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
});
