import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'src', 'server.js');
const PORT = 7399; // avoid conflict with default 7345

function request(ws, method, params = {}) {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 8000);
    const onMessage = (raw) => {
      const payload = JSON.parse(String(raw));
      if (payload.id !== id) return;
      clearTimeout(timeout);
      ws.off('message', onMessage);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result);
    };
    ws.on('message', onMessage);
  });
}

function collectEvents(ws, methods, timeoutMs = 5000) {
  const events = [];
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(events), timeoutMs);
    const onMessage = (raw) => {
      const payload = JSON.parse(String(raw));
      if (!payload.id && methods.includes(payload.method)) {
        events.push(payload);
      }
      // Resolve early when we get message.done
      if (payload.method === 'message.done') {
        clearTimeout(timeout);
        // Give a small buffer for any trailing events
        setTimeout(() => {
          ws.off('message', onMessage);
          resolve(events);
        }, 300);
      }
    };
    ws.on('message', onMessage);
  });
}

describe('stub mode end-to-end flow', () => {
  let server;
  let ws;

  before(async () => {
    // Start bridge in stub mode on a test port
    server = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(PORT), OPENCODE_BRIDGE_MODE: 'stub' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('server start timeout')), 5000);
      server.stdout.on('data', (data) => {
        if (String(data).includes('listening')) {
          clearTimeout(timeout);
          resolve();
        }
      });
      server.on('error', (err) => { clearTimeout(timeout); reject(err); });
    });

    // Connect WebSocket
    ws = new WebSocket(`ws://127.0.0.1:${PORT}`);
    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
    });

    // Consume connection.ready event
    await new Promise((resolve) => {
      const onMsg = (raw) => {
        const p = JSON.parse(String(raw));
        if (p.method === 'connection.ready') {
          ws.off('message', onMsg);
          resolve(p);
        }
      };
      ws.on('message', onMsg);
    });
  });

  after(() => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    if (server) server.kill();
  });

  it('connection.info returns host health', async () => {
    const result = await request(ws, 'connection.info');
    assert.ok(result.host, 'should have host field');
    assert.ok(result.host.bridgeStatus, 'should have bridgeStatus');
    assert.equal(result.host.runtimeMode, 'stub');
  });

  it('session.list returns sessions array', async () => {
    const result = await request(ws, 'session.list');
    assert.ok(Array.isArray(result.sessions), 'sessions should be an array');
  });

  it('session.create returns session with messages', async () => {
    const result = await request(ws, 'session.create', { workspace: '/tmp/test' });
    assert.ok(result.session, 'should have session');
    assert.ok(result.session.id, 'session should have id');
    assert.ok(Array.isArray(result.messages), 'should have messages array');
    assert.ok(Array.isArray(result.approvals), 'should have approvals array');
  });

  it('session.resume returns session with history', async () => {
    const created = await request(ws, 'session.create', { workspace: '/tmp/test2' });
    const result = await request(ws, 'session.resume', { sessionId: created.session.id });
    assert.ok(result.session, 'should have session');
    assert.equal(result.session.id, created.session.id);
    assert.ok(Array.isArray(result.messages), 'should have messages');
  });

  it('message.send triggers streaming response (delta + done)', async () => {
    const created = await request(ws, 'session.create', { workspace: '/tmp/test3' });
    const sessionId = created.session.id;

    // Start collecting events before sending
    const eventsPromise = collectEvents(ws, ['message.delta', 'message.done', 'task.status', 'session.updated']);

    // Send message
    const sendResult = await request(ws, 'message.send', { sessionId, text: 'hello from e2e test' });
    assert.ok(sendResult.accepted, 'message should be accepted');

    // Wait for streaming events
    const events = await eventsPromise;

    const deltas = events.filter((e) => e.method === 'message.delta');
    const dones = events.filter((e) => e.method === 'message.done');

    assert.ok(deltas.length > 0, `should receive message.delta events, got ${deltas.length}`);
    assert.ok(dones.length > 0, `should receive message.done event, got ${dones.length}`);

    // Verify delta structure
    const firstDelta = deltas[0];
    assert.equal(firstDelta.params.sessionId, sessionId);
    assert.ok(firstDelta.params.messageId, 'delta should have messageId');
    assert.ok(typeof firstDelta.params.textDelta === 'string', 'delta should have textDelta string');
  });

  it('task.cancel returns cancelled', async () => {
    const created = await request(ws, 'session.create', { workspace: '/tmp/test4' });
    const result = await request(ws, 'task.cancel', { sessionId: created.session.id });
    assert.ok(result.cancelled, 'should return cancelled: true');
  });
});
