import { ActiveSessionIdByProject, ApprovalRequest, AuthProfile, ChatMessage, ModelConfig, Project, ProjectSession, SessionSummary, TaskStatusEvent } from './types';

const now = new Date().toISOString();

export const sampleProjects: Project[] = [
  {
    id: 'proj_demo',
    name: '데모 프로젝트',
    workspacePath: '/workspace/demo',
    bridgeEndpoint: 'ws://192.168.0.10:7345',
    defaultModelId: 'local/opencode-runtime',
    authProfileId: 'auth_local_bridge',
    defaultSessionId: 'sess_demo',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  },
  {
    id: 'proj_mobile',
    name: '모바일 재설계',
    workspacePath: '/workspace/opencode-mobile',
    bridgeEndpoint: 'ws://192.168.0.10:7345',
    defaultModelId: 'local/opencode-runtime',
    authProfileId: 'auth_local_bridge',
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
    title: '데모 세션',
    workspacePath: '/workspace/demo',
    updatedAt: now,
    createdAt: now,
    status: 'idle',
    transport: 'stub',
    runtimeSessionID: 'ses_demo_runtime',
    lastTool: null,
    consentState: null,
    lastMessagePreview: '휴대폰에서 리팩터링 작업을 요청해 보세요.',
    modelId: 'local/opencode-runtime',
    authProfileId: 'auth_local_bridge',
  },
  {
    id: 'sess_mobile_1',
    projectId: 'proj_mobile',
    title: '세션 01 · 레일 재설계',
    workspacePath: '/workspace/opencode-mobile',
    updatedAt: now,
    createdAt: now,
    status: 'running',
    transport: 'stub',
    runtimeSessionID: 'ses_mobile_runtime_a',
    lastTool: 'read',
    consentState: null,
    lastMessagePreview: '프로젝트 범위 세션 UX를 구현합니다.',
    modelId: 'local/opencode-runtime',
    authProfileId: 'auth_local_bridge',
  },
  {
    id: 'sess_mobile_2',
    projectId: 'proj_mobile',
    title: '세션 02 · 설정 화면',
    workspacePath: '/workspace/opencode-mobile',
    updatedAt: now,
    createdAt: now,
    status: 'idle',
    transport: 'stub',
    runtimeSessionID: 'ses_mobile_runtime_b',
    lastTool: 'edit',
    consentState: null,
    lastMessagePreview: '설정을 전용 화면으로 분리합니다.',
    modelId: 'anthropic/claude-sonnet',
    authProfileId: 'auth_claude_default',
  },
];

export const sampleAuthProfiles: AuthProfile[] = [
  {
    id: 'auth_openai_default',
    providerId: 'openai',
    label: 'OpenAI 기본 프로필',
    status: 'connected',
    authMethod: 'api_key',
    accountLabel: '기기에 설정됨',
    lastValidatedAt: now,
  },
  {
    id: 'auth_claude_default',
    providerId: 'anthropic',
    label: 'Claude 기본 프로필',
    status: 'disconnected',
    authMethod: 'api_key',
    accountLabel: '미연결',
    lastValidatedAt: now,
  },
  {
    id: 'auth_local_bridge',
    providerId: 'opencode-bridge',
    label: 'OpenCode 브리지 기본 프로필',
    status: 'connected',
    authMethod: 'bridge_inherited',
    accountLabel: '로컬 브리지 연결',
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
  {
    id: 'anthropic/claude-sonnet',
    providerId: 'anthropic',
    label: 'Claude Sonnet',
    available: true,
    supportsTools: true,
    supportsStreaming: true,
  },
  {
    id: 'local/opencode-runtime',
    providerId: 'opencode',
    label: 'OpenCode Runtime',
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
      text: 'OpenCode 모바일 클라이언트가 준비되었습니다. 브리지에 연결하고 세션을 열어 휴대폰에서 작업을 이어가세요.',
      createdAt: now,
    },
  ],
  sess_mobile_1: [
    {
      id: 'msg_mobile_1',
      sessionId: 'sess_mobile_1',
      role: 'user',
      text: '세션 레일을 프로젝트 범위로 다시 설계해줘.',
      createdAt: now,
    },
    {
      id: 'msg_mobile_2',
      sessionId: 'sess_mobile_1',
      role: 'assistant',
      text: '프로젝트 인지형 레일과 워크스페이스 콘솔 레이아웃을 작업 중입니다.',
      createdAt: now,
    },
  ],
  sess_mobile_2: [
    {
      id: 'msg_mobile_3',
      sessionId: 'sess_mobile_2',
      role: 'assistant',
      text: '설정 화면 분리는 준비되었고 후속 작업을 기다리고 있습니다.',
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
      title: '셸 명령 실행',
      detail: '파일을 바꾸기 전에 워크스페이스 명령을 실행하려고 합니다.',
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
      title: '현재 작업 경로 출력',
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
      output: 'App.tsx와 프로젝트 범위 세션 UI 컴포넌트를 검토하는 중',
      title: '프로젝트 범위 세션 UI 점검',
    },
  },
  sess_mobile_2: null,
};

export const sampleSessions: SessionSummary[] = sampleProjectSessions.map((session) => ({
  ...session,
  workspace: session.workspacePath,
}));
const demoSessionId = sampleActiveSessionIdByProject.proj_demo || 'sess_demo';
export const sampleMessages: ChatMessage[] = sampleMessagesBySessionId[demoSessionId] || [];
export const sampleApprovals: ApprovalRequest[] = sampleApprovalsBySessionId[demoSessionId] || [];
export const sampleTaskStatus: TaskStatusEvent | null = sampleTaskStatusBySessionId[demoSessionId] || null;
