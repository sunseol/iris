import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionStore } from '../src/session-store.js';

test('session store preserves message history payloads', () => {
  const dir = mkdtempSync(join(tmpdir(), 'opencode-mobile-'));
  const statePath = join(dir, 'sessions.json');
  const store = new SessionStore(statePath);
  store.save([
    {
      session: {
        id: 'sess_1',
        title: 'Session',
        workspace: '/tmp',
        updatedAt: new Date().toISOString(),
        status: 'idle',
        transport: 'process',
      },
      messages: [
        { id: 'm1', role: 'user', text: 'hello', createdAt: new Date().toISOString() },
        { id: 'm2', role: 'assistant', text: 'world', createdAt: new Date().toISOString() },
      ],
    },
  ]);

  const loaded = store.load();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].messages.length, 2);
  assert.equal(loaded[0].messages[1].text, 'world');
});
