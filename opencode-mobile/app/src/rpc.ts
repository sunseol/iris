import { ApprovalRequest, ChatMessage, ProjectSession, RpcEvent, RpcRequest, RpcResponse } from './types';

const DEFAULT_CONNECT_TIMEOUT_MS = 5000;

export type SessionListResult = { sessions: ProjectSession[] };
export type SessionResumeResult = { session: ProjectSession; messages: ChatMessage[]; approvals: ApprovalRequest[] };
export type SessionCreateParams = { projectId?: string; workspace?: string; correlationId?: string; modelId?: string };
export type SessionResumeParams = { projectId?: string; sessionId: string };
export type MessageSendParams = { projectId?: string; sessionId: string; text: string; correlationId?: string };

export class BridgeClient {
  private socket: WebSocket | null = null;
  private pending = new Map<string, (response: RpcResponse) => void>();
  private listeners = new Set<(event: RpcEvent) => void>();

  connect(url: string, timeoutMs = DEFAULT_CONNECT_TIMEOUT_MS) {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const socket = new WebSocket(url);
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        try {
          socket.close();
        } catch {}
        reject(new Error('bridge connection timeout'));
      }, timeoutMs);
      const cleanup = () => clearTimeout(timeout);
      this.socket = socket;
      socket.onopen = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      socket.onerror = () => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(new Error('bridge connection failed'));
      };
      socket.onmessage = (message) => {
        const payload = JSON.parse(String(message.data)) as RpcResponse | RpcEvent;
        if ('id' in payload) {
          const handler = this.pending.get(payload.id);
          if (handler) {
            this.pending.delete(payload.id);
            handler(payload);
          }
          return;
        }
        this.listeners.forEach((listener) => listener(payload));
      };
      socket.onclose = () => {
        cleanup();
        const wasConnected = this.socket === socket;
        if (wasConnected) {
          this.socket = null;
          this.pending.clear();
          this.listeners.forEach((listener) => listener({ jsonrpc: '2.0', method: 'connection.closed', params: { reason: 'socket closed' } }));
        }
        if (!settled) {
          settled = true;
          reject(new Error('bridge connection failed'));
        }
      };
    });
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
    this.pending.clear();
  }

  isConnected() {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  onEvent(listener: (event: RpcEvent) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async log(payload: Record<string, unknown>) {
    try {
      await this.request('client.log', payload);
    } catch {}
  }

  request<T = unknown>(method: string, params?: Record<string, unknown>) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('bridge not connected'));
    }
    const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const payload: RpcRequest = { jsonrpc: '2.0', id, method, params };
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
          return;
        }
        resolve(response.result as T);
      });
      this.socket?.send(JSON.stringify(payload));
    });
  }

  listSessions(params?: { projectId?: string }) {
    return this.request<SessionListResult>('session.list', params?.projectId ? { projectId: params.projectId } : undefined);
  }

  createSession(params: SessionCreateParams) {
    return this.request<SessionResumeResult>('session.create', params);
  }

  resumeSession(params: SessionResumeParams) {
    return this.request<SessionResumeResult>('session.resume', params);
  }

  sendMessage(params: MessageSendParams) {
    return this.request('message.send', params);
  }
}

export const bridgeClient = new BridgeClient();
