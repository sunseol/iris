import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverPath = join(__dirname, '..', 'src', 'server.js');
const PORT = 7398; // avoid conflict with default 7345 and stub test 7399

function request(ws, method, params = {}) {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 30000);
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

function collectEvents(ws, methods, timeoutMs = 60000) {
  const events = [];
  return new Promise((resolve) => {
    const timeout = setTimeout(() => resolve(events), timeoutMs);
    const onMessage = (raw) => {
      const payload = JSON.parse(String(raw));
      if (!payload.id && methods.includes(payload.method)) {
        events.push(payload);
        console.log(`  [event] ${payload.method}: ${JSON.stringify(payload.params).slice(0, 200)}`);
      }
      if (payload.method === 'message.done') {
        clearTimeout(timeout);
        setTimeout(() => {
          ws.off('message', onMessage);
          resolve(events);
        }, 1000);
      }
    };
    ws.on('message', onMessage);
  });
}

describe('process mode end-to-end flow (real OpenCode)', () => {
  let server;
  let ws;
  let readyParams;

  before(async () => {
    console.log('[e2e-process] Starting bridge in process mode...');
    server = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(PORT), OPENCODE_BRIDGE_MODE: 'process' },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    server.stdout.on('data', (d) => console.log(`  [bridge stdout] ${String(d).trim()}`));
    server.stderr.on('data', (d) => console.log(`  [bridge stderr] ${String(d).trim()}`));

    // Wait for server to be ready (listen on port)
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('server start timeout')), 10000);
      server.stdout.on('data', (data) => {
        if (String(data).includes('adapter=') || String(data).includes('listening')) {
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
    readyParams = await new Promise((resolve) => {
      const onMsg = (raw) => {
        const p = JSON.parse(String(raw));
        if (p.method === 'connection.ready') {
          ws.off('message', onMsg);
          resolve(p.params);
        }
      };
      ws.on('message', onMsg);
    });

    console.log(`[e2e-process] connection.ready: ${JSON.stringify(readyParams)}`);
  });

  after(() => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    if (server) {
      try { process.kill(-server.pid, 'SIGTERM'); } catch {}
      server.kill();
    }
  });

  it('bridge starts with ProcessBackedOpenCodeAdapter', () => {
    assert.equal(readyParams.bridge, 'ProcessBackedOpenCodeAdapter', `Expected process adapter, got: ${readyParams.bridge}`);
    assert.equal(readyParams.mode, 'process');
    console.log('[EVIDENCE] Adapter confirmed: ProcessBackedOpenCodeAdapter');
  });

  it('connection.info returns host health with process mode', async () => {
    const result = await request(ws, 'connection.info');
    assert.ok(result.host, 'should have host field');
    console.log(`[EVIDENCE] host info: ${JSON.stringify(result.host)}`);
  });

  it('session.create returns a real session', async () => {
    const result = await request(ws, 'session.create', { workspace: process.cwd() });
    assert.ok(result.session, 'should have session');
    assert.ok(result.session.id, 'session should have id');
    assert.equal(result.session.transport, 'process');
    console.log(`[EVIDENCE] Created session: ${result.session.id} transport=${result.session.transport}`);
  });

  it('message.send triggers real OpenCode response (delta + done)', async () => {
    const created = await request(ws, 'session.create', { workspace: process.cwd() });
    const sessionId = created.session.id;
    console.log(`[e2e-process] Sending "hello from mobile" to session ${sessionId}...`);

    // Start collecting events before sending
    const eventsPromise = collectEvents(ws, ['message.delta', 'message.done', 'task.status', 'task.error', 'session.updated']);

    // Send message
    const sendResult = await request(ws, 'message.send', { sessionId, text: 'hello from mobile, reply with just "hi" in one word' });
    assert.ok(sendResult.accepted, 'message should be accepted');
    console.log(`[EVIDENCE] message.send accepted: ${JSON.stringify(sendResult)}`);

    // Wait for streaming events (real OpenCode may take up to 60s)
    const events = await eventsPromise;

    const deltas = events.filter((e) => e.method === 'message.delta');
    const dones = events.filter((e) => e.method === 'message.done');
    const errors = events.filter((e) => e.method === 'task.error');

    console.log(`[EVIDENCE] Events received: ${deltas.length} deltas, ${dones.length} dones, ${errors.length} errors`);

    if (errors.length > 0) {
      console.log(`[EVIDENCE] task.error: ${JSON.stringify(errors[0].params)}`);
    }

    // Reconstruct full response text from deltas
    const fullText = deltas.map((e) => e.params.textDelta).join('');
    console.log(`[EVIDENCE] Full assistant response: "${fullText.slice(0, 500)}"`);

    if (errors.length > 0 && deltas.length === 0) {
      assert.fail(`OpenCode returned error without any response: ${errors[0].params.message || JSON.stringify(errors[0].params)}`);
    }

    assert.ok(deltas.length > 0, `should receive message.delta events, got ${deltas.length}`);
    assert.ok(fullText.length > 0, 'assistant response should not be empty');
    console.log('[EVIDENCE] Real OpenCode round-trip verified: message sent, real response received');
  });

  it('session.resume returns session with persisted messages', async () => {
    const created = await request(ws, 'session.create', { workspace: process.cwd() });
    const sessionId = created.session.id;

    // Send a message and wait for response
    const eventsPromise = collectEvents(ws, ['message.done'], 60000);
    await request(ws, 'message.send', { sessionId, text: 'say ok' });
    await eventsPromise;

    // Resume and check messages are persisted
    const resumed = await request(ws, 'session.resume', { sessionId });
    assert.ok(resumed.session, 'should have session');
    assert.ok(resumed.messages.length >= 2, `should have at least user + assistant messages, got ${resumed.messages.length}`);
    console.log(`[EVIDENCE] Resumed session ${sessionId}: ${resumed.messages.length} messages persisted`);
    console.log(`[EVIDENCE] Messages: ${JSON.stringify(resumed.messages.map(m => ({ role: m.role, text: m.text?.slice(0, 80) })))}`);
  });
});
