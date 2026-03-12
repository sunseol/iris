import { ApprovalRequest, ChatMessage, SessionSummary } from './types';

export type BridgeMode = 'disconnected' | 'connecting' | 'connected';

export type BridgeState = {
  mode: BridgeMode;
  endpoint: string;
  sessions: SessionSummary[];
  activeSessionId: string | null;
  messages: ChatMessage[];
  approvals: ApprovalRequest[];
  error: string | null;
  info: string | null;
};

export const initialBridgeState: BridgeState = {
  mode: 'disconnected',
  endpoint: 'ws://192.168.0.10:7345',
  sessions: [],
  activeSessionId: null,
  messages: [],
  approvals: [],
  error: null,
  info: 'Enter your bridge endpoint or restore a recent one.',
};
