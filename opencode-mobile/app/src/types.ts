export type JsonRpcId = string;

export type SessionStatus = 'idle' | 'running' | 'waiting_approval' | 'cancelled' | 'disconnected' | 'error';
export type ConnectionMode = 'disconnected' | 'connecting' | 'connected';

export type Project = {
  id: string;
  name: string;
  workspacePath: string;
  repoRoot?: string;
  bridgeEndpoint?: string;
  defaultModelId?: string | null;
  authProfileId?: string | null;
  defaultSessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string | null;
  archived?: boolean;
};

export type ProjectSession = {
  id: string;
  projectId: string;
  title: string;
  workspacePath: string;
  updatedAt: string;
  createdAt?: string;
  status: SessionStatus;
  transport?: 'stub' | 'process' | string;
  lastMessagePreview?: string;
  runtimeSessionID?: string | null;
  lastTool?: string | null;
  consentState?: {
    approved: boolean;
    approvalId: string;
    detail?: string;
    updatedAt?: string;
  } | null;
  modelId?: string | null;
  authProfileId?: string | null;
  lastError?: string | null;
};

export type AuthProfile = {
  id: string;
  providerId: 'openai' | 'anthropic' | 'openrouter' | 'local' | string;
  label: string;
  status: 'connected' | 'disconnected' | 'expired' | 'unknown';
  authMethod?: 'api_key' | 'oauth' | 'bridge_inherited' | 'local';
  accountLabel?: string | null;
  lastValidatedAt?: string | null;
};

export type ModelConfig = {
  id: string;
  providerId: string;
  label: string;
  available: boolean;
  supportsTools?: boolean;
  supportsStreaming?: boolean;
  recommended?: boolean;
  contextWindow?: number;
};

export type ActiveSessionIdByProject = Record<string, string | null>;

export type RpcRequest = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

export type RpcResponse<T = unknown> = {
  jsonrpc: '2.0';
  id: JsonRpcId;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

export type RpcEvent<T = unknown> = {
  jsonrpc: '2.0';
  method: string;
  params?: T;
};

export type SessionMessage = {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt: string;
  pending?: boolean;
  kind?: 'prompt' | 'output' | 'error' | 'status';
};

export type ApprovalRequest = {
  id: string;
  sessionId: string;
  projectId?: string;
  title: string;
  detail: string;
  createdAt: string;
  risk?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'approved' | 'denied';
};

export type TaskStatusEvent = {
  sessionId: string;
  projectId?: string;
  status: string;
  tool?: string;
  callID?: string;
  state?: {
    status?: string;
    input?: Record<string, unknown>;
    output?: string;
    title?: string;
    metadata?: Record<string, unknown>;
    time?: { start?: number; end?: number };
  };
};

// Compatibility aliases for the pre-project-first app structure.
export type SessionSummary = ProjectSession & { workspace: string };
export type ChatMessage = SessionMessage;
