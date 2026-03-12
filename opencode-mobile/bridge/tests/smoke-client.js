import { WebSocket } from 'ws';

const url = process.env.SMOKE_URL || 'ws://127.0.0.1:7345';

function request(ws, method, params = {}) {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  ws.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }));
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`timeout waiting for ${method}`)), 5000);
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

const ws = new WebSocket(url);

ws.on('open', async () => {
  try {
    const info = await request(ws, 'connection.info');
    const list = await request(ws, 'session.list');
    const created = await request(ws, 'session.create', { workspace: '/workspace/demo' });
    const resumed = await request(ws, 'session.resume', { sessionId: created.session.id });
    await request(ws, 'message.send', { sessionId: created.session.id, text: 'please request approval before bash command' });
    console.log(JSON.stringify({ ok: true, info, sessionCount: list.sessions.length, createdSession: created.session.id, resumedMessages: resumed.messages.length }));
    ws.close();
    process.exit(0);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  console.error(error.message);
  process.exit(1);
});
