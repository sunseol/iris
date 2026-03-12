import { ActiveSessionIdByProject, ApprovalRequest, AuthProfile, ChatMessage, ModelConfig, Project, ProjectSession, SessionSummary, TaskStatusEvent } from './types';

const now = new Date().toISOString();

export const sampleProjects: Project[] = [
  {
    id: 'proj_demo',
    name: 'Demo project',
    workspacePath: '/workspace/demo',
    bridgeEndpoint: 'ws://192.168.0.10:7345',
    defaultModelId: 'openai/gpt-5.4',
    authProfileId: 'auth_openai_default',
    defaultSessionId: 'sess_demo',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  },
  {
    id: 'proj_mobile',
    name: 'Mobile redesign',
    workspacePath: '/workspace/opencode-mobile',
    bridgeEndpoint: 'ws://192.168.0.10:7345',
    defaultModelId: 'openai/gpt-5.3-codex',
    authProfileId: 'auth_openai_default',
    defaultSessionId: 'sess_mobile_1',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  },
];

export const sampleProjectSessions: ProjectSession[] = [
  {
    id: 'sess_demo',
    projectId: 'proj_demo',
    title: 'Demo session',
    workspacePath: '/workspace/demo',
    updatedAt: now,
    createdAt: now,
    status: 'idle',
    transport: 'stub',
    runtimeSessionID: 'ses_demo_runtime',
    lastTool: null,
    consentState: null,
    lastMessagePreview: 'Try asking for a refactor from your phone.',
    modelId: 'openai/gpt-5.4',
    authProfileId: 'auth_openai_default',
  },
  {
    id: 'sess_mobile_1',
    projectId: 'proj_mobile',
    title: 'Session 01 · rail redesign',
    workspacePath: '/workspace/opencode-mobile',
    updatedAt: now,
    createdAt: now,
    status: 'running',
    transport: 'stub',
    runtimeSessionID: 'ses_mobile_runtime_a',
    lastTool: 'read',
    consentState: null,
    lastMessagePreview: 'Implement project-scoped session UX.',
    modelId: 'openai/gpt-5.3-codex',
    authProfileId: 'auth_openai_default',
  },
  {
    id: 'sess_mobile_2',
    projectId: 'proj_mobile',
    title: 'Session 02 · auth settings',
    workspacePath: '/workspace/opencode-mobile',
    updatedAt: now,
    createdAt: now,
    status: 'idle',
    transport: 'stub',
    runtimeSessionID: 'ses_mobile_runtime_b',
    lastTool: 'edit',
    consentState: null,
    lastMessagePreview: 'Split settings into dedicated screens.',
    modelId: 'openai/gpt-5.4',
    authProfileId: 'auth_openai_default',
  },
];

export const sampleAuthProfiles: AuthProfile[] = [
  {
    id: 'auth_openai_default',
    providerId: 'openai',
    label: 'OpenAI default',
    status: 'connected',
    authMethod: 'api_key',
    accountLabel: 'Configured on device',
    lastValidatedAt: now,
  },
];

export const sampleModelCatalog: ModelConfig[] = [
  {
    id: 'openai/gpt-5.4',
    providerId: 'openai',
    label: 'GPT 5.4',
    available: true,
    supportsTools: true,
    supportsStreaming: true,
    recommended: true,
  },
  {
    id: 'openai/gpt-5.3-codex',
    providerId: 'openai',
    label: 'GPT 5.3 Codex',
    available: true,
    supportsTools: true,
    supportsStreaming: true,
  },
];

export const sampleActiveSessionIdByProject: ActiveSessionIdByProject = {
  proj_demo: 'sess_demo',
  proj_mobile: 'sess_mobile_1',
};

export const sampleMessagesBySessionId: Record<string, ChatMessage[]> = {
  sess_demo: [
    {
      id: 'msg_boot',
      sessionId: 'sess_demo',
      role: 'assistant',
      text: 'OpenCode Mobile MVP is ready. Connect to a bridge, open a session, and continue work from your phone.',
      createdAt: now,
    },
  ],
  sess_mobile_1: [
    {
      id: 'msg_mobile_1',
      sessionId: 'sess_mobile_1',
      role: 'user',
      text: 'Redesign the session rail so it is project-scoped.',
      createdAt: now,
    },
    {
      id: 'msg_mobile_2',
      sessionId: 'sess_mobile_1',
      role: 'assistant',
      text: 'Working on a project-aware rail and workspace console layout.',
      createdAt: now,
    },
  ],
  sess_mobile_2: [
    {
      id: 'msg_mobile_3',
      sessionId: 'sess_mobile_2',
      role: 'assistant',
      text: 'Settings split is staged and ready for follow-up work.',
      createdAt: now,
    },
  ],
};

export const sampleApprovalsBySessionId: Record<string, ApprovalRequest[]> = {
  sess_demo: [
    {
      id: 'approval_demo_1',
      projectId: 'proj_demo',
      sessionId: 'sess_demo',
      title: 'Run shell command',
      detail: 'Plan mode wants permission to run a workspace command before changing files.',
      createdAt: now,
      risk: 'medium',
    },
  ],
  sess_mobile_1: [],
  sess_mobile_2: [],
};

export const sampleTaskStatusBySessionId: Record<string, TaskStatusEvent | null> = {
  sess_demo: {
    projectId: 'proj_demo',
    sessionId: 'sess_demo',
    status: 'tool-use',
    tool: 'bash',
    callID: 'call_demo',
    state: {
      status: 'completed',
      output: '/workspace/demo',
      title: 'Print current working directory',
    },
  },
  sess_mobile_1: {
    projectId: 'proj_mobile',
    sessionId: 'sess_mobile_1',
    status: 'tool-use',
    tool: 'read',
    callID: 'call_mobile_1',
    state: {
      status: 'running',
      output: 'Reviewing App.tsx and session rail components',
      title: 'Inspect project-scoped session UI',
    },
  },
  sess_mobile_2: null,
};

// Compatibility exports for the current UI while the project-first migration lands.
export const sampleSessions: SessionSummary[] = sampleProjectSessions.map((session) => ({
  ...session,
  workspace: session.workspacePath,
}));
const demoSessionId = sampleActiveSessionIdByProject.proj_demo || 'sess_demo';
export const sampleMessages: ChatMessage[] = sampleMessagesBySessionId[demoSessionId] || [];
export const sampleApprovals: ApprovalRequest[] = sampleApprovalsBySessionId[demoSessionId] || [];
export const sampleTaskStatus: TaskStatusEvent | null = sampleTaskStatusBySessionId[demoSessionId] || null;
