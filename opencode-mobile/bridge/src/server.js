import { WebSocketServer } from 'ws';
import { z } from 'zod';
import { createAdapter } from './adapter-factory.js';
import { getHostInfo } from './host-info.js';
import { writeDiagnostic } from './diagnostic-log.js';

const requestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.string(),
  method: z.string(),
  params: z.record(z.string(), z.unknown()).optional(),
});

const port = Number(process.env.PORT || 7345);
const adapter = createAdapter();
console.log(`[bridge] adapter=${adapter.constructor.name} mode=${process.env.OPENCODE_BRIDGE_MODE || 'process'} port=${port}`);
const wss = new WebSocketServer({ port });

function send(socket, payload) {
  socket.send(JSON.stringify(payload));
}

function broadcast(payload) {
  for (const client of wss.clients) {
    if (client.readyState === 1) {
      send(client, payload);
    }
  }
}

const runtimeHandlers = {
  onMessageDelta(sessionId, messageId, textDelta) {
    broadcast({ jsonrpc: '2.0', method: 'message.delta', params: { sessionId, messageId, textDelta } });
  },
  onMessageDone(sessionId, messageId) {
    broadcast({ jsonrpc: '2.0', method: 'message.done', params: { sessionId, messageId } });
  },
  onTaskError(sessionId, message) {
    broadcast({ jsonrpc: '2.0', method: 'task.error', params: { sessionId, message } });
  },
  onTaskStatus(sessionId, payload) {
    broadcast({ jsonrpc: '2.0', method: 'task.status', params: { sessionId, ...payload } });
  },
  onSessionUpdated(session) {
    broadcast({ jsonrpc: '2.0', method: 'session.updated', params: session });
  },
  onApprovalRequested(approval) {
    broadcast({ jsonrpc: '2.0', method: 'approval.requested', params: approval });
  },
  onApprovalResolved(approval) {
    broadcast({ jsonrpc: '2.0', method: 'approval.resolved', params: approval });
  },
  onThinking(sessionId, thinking) {
    broadcast({ jsonrpc: '2.0', method: 'message.thinking', params: { sessionId, thinking } });
  },
};

wss.on('connection', (socket) => {
  writeDiagnostic({ side: 'bridge', event: 'ws.connection' });
  send(socket, {
    jsonrpc: '2.0',
    method: 'connection.ready',
    params: { ok: true, bridge: adapter.constructor.name, port, mode: process.env.OPENCODE_BRIDGE_MODE || 'stub' },
  });

  socket.on('message', async (raw) => {
    try {
      const request = requestSchema.parse(JSON.parse(String(raw)));
      const correlationId = String(request.params?.correlationId || 'none');
      writeDiagnostic({ side: 'bridge', event: 'rpc.inbound', method: request.method, requestId: request.id, correlationId, params: request.params || {} });
      switch (request.method) {
        case 'client.log': {
          writeDiagnostic({ side: 'app', event: 'client.log', requestId: request.id, correlationId, payload: request.params || {} });
          send(socket, { jsonrpc: '2.0', id: request.id, result: { ok: true } });
          break;
        }
        case 'connection.info': {
          send(socket, { jsonrpc: '2.0', id: request.id, result: { host: getHostInfo() } });
          break;
        }
        case 'session.list': {
          send(socket, { jsonrpc: '2.0', id: request.id, result: { sessions: adapter.listSessions() } });
          break;
        }
        case 'session.create': {
          const session = adapter.createSession(String(request.params?.workspace || process.cwd()));
          send(socket, { jsonrpc: '2.0', id: request.id, result: { session, messages: adapter.getMessages(session.id), approvals: adapter.listApprovals?.(session.id) || [] } });
          runtimeHandlers.onSessionUpdated(session);
          break;
        }
        case 'session.resume': {
          const sessionId = String(request.params?.sessionId || '');
          const session = adapter.requireSession(sessionId);
          send(socket, { jsonrpc: '2.0', id: request.id, result: { session, messages: adapter.getMessages(session.id), approvals: adapter.listApprovals?.(session.id) || [] } });
          break;
        }
        case 'message.send': {
          const sessionId = String(request.params?.sessionId || '');
          const text = String(request.params?.text || '');
          adapter.pushUserMessage(sessionId, text, runtimeHandlers);
          writeDiagnostic({ side: 'bridge', event: 'message.send.accepted', correlationId, sessionId, text });
          send(socket, { jsonrpc: '2.0', id: request.id, result: { accepted: true } });
          break;
        }
        case 'task.cancel': {
          const sessionId = String(request.params?.sessionId || '');
          adapter.cancel(sessionId);
          send(socket, { jsonrpc: '2.0', id: request.id, result: { cancelled: true } });
          runtimeHandlers.onTaskError(sessionId, 'Task cancelled');
          break;
        }
        case 'approval.respond': {
          const approvalId = String(request.params?.approvalId || '');
          const approved = Boolean(request.params?.approved);
          const approval = adapter.respondToApproval(approvalId, approved, runtimeHandlers);
          send(socket, { jsonrpc: '2.0', id: request.id, result: { approval } });
          break;
        }
        default:
          send(socket, { jsonrpc: '2.0', id: request.id, error: { code: -32601, message: `Unknown method: ${request.method}` } });
      }
    } catch (error) {
      writeDiagnostic({ side: 'bridge', event: 'rpc.error', error: error instanceof Error ? error.message : String(error) });
      send(socket, {
        jsonrpc: '2.0',
        id: 'unknown',
        error: { code: -32000, message: error instanceof Error ? error.message : 'bridge error' },
      });
    }
  });
});

console.log(`OpenCode Mobile bridge listening on ws://0.0.0.0:${port}`);
