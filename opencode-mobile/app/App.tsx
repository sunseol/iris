import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { bridgeClient } from './src/rpc';
import {
  loadEndpoint,
  loadPairingCode,
  migrateLegacyProjectState,
  saveActiveProjectId,
  saveActiveSessionIdByProject,
  saveEndpoint,
  savePairingCode,
  saveProjects,
  saveSessionId,
} from './src/storage';
import {
  ActiveSessionIdByProject,
  ApprovalRequest,
  AuthProfile,
  ChatMessage,
  ModelConfig,
  Project,
  ProjectSession,
  RpcEvent,
  SessionSummary,
  TaskStatusEvent,
} from './src/types';
import { AppInput, GhostButton, Label, PrimaryButton, SecondaryButton, SectionCard } from './src/components';
import { colors } from './src/theme';
import { formatStatus, formatTime } from './src/format';
import {
  sampleActiveSessionIdByProject,
  sampleApprovalsBySessionId,
  sampleAuthProfiles,
  sampleMessagesBySessionId,
  sampleModelCatalog,
  sampleProjects,
  sampleProjectSessions,
  sampleTaskStatusBySessionId,
} from './src/sample-data';
import { getNextOnboardingStep, getOnboardingCopy } from './src/onboarding';
import { parsePairingPayload } from './src/qr-placeholder';
import { HostHealth } from './src/host-types';
import { sampleHostHealth } from './src/sample-host';
import { makeCorrelationId } from './src/debug';
import { ProjectWorkspaceScreen } from './src/screens/ProjectWorkspaceScreen';
import { ProjectsScreen } from './src/screens/ProjectsScreen';
import { ModelsAuthScreen } from './src/screens/ModelsAuthScreen';
import { ConnectionScreen } from './src/screens/ConnectionScreen';

const DEFAULT_ENDPOINT = 'ws://192.168.0.10:7345';
const SAMPLE_QR_PAYLOAD = '{"endpoint":"ws://192.168.0.10:7345","pairingCode":"PAIR-1234"}';

type Screen = 'workspace' | 'projects' | 'modelsAuth' | 'connection';

function projectWorkspace(project: Project | null) {
  return project?.workspacePath || '/home/jakeseol/.openclaw/workspace';
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('workspace');
  const autoTestBridge = process.env.EXPO_PUBLIC_AUTOTEST_BRIDGE || '';
  const autoTestMessage = process.env.EXPO_PUBLIC_AUTOTEST_MESSAGE || 'hi';
  const autoTestEnabled = process.env.EXPO_PUBLIC_AUTOTEST_MODE === '1';
  const [autoTestRan, setAutoTestRan] = useState(false);
  const autoConnectAttemptedRef = useRef(false);
  const [endpoint, setEndpoint] = useState(autoTestBridge || DEFAULT_ENDPOINT);
  const [pairingCode, setPairingCode] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerHint, setScannerHint] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mode, setMode] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [hostHealth, setHostHealth] = useState<HostHealth>(sampleHostHealth);
  const [projects, setProjects] = useState<Project[]>(sampleProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(sampleProjects[0]?.id ?? null);
  const [activeSessionIdByProject, setActiveSessionMap] = useState<ActiveSessionIdByProject>(sampleActiveSessionIdByProject);
  const [sessions, setSessions] = useState<ProjectSession[]>(sampleProjectSessions);
  const [messagesBySessionId, setMessagesBySessionId] = useState<Record<string, ChatMessage[]>>(sampleMessagesBySessionId);
  const [approvalsBySessionId, setApprovalsBySessionId] = useState<Record<string, ApprovalRequest[]>>(sampleApprovalsBySessionId);
  const [taskStatusBySessionId, setTaskStatusBySessionId] = useState<Record<string, TaskStatusEvent | null>>(sampleTaskStatusBySessionId);
  const [authProfiles, setAuthProfiles] = useState<AuthProfile[]>(sampleAuthProfiles);
  const [modelCatalog] = useState<ModelConfig[]>(sampleModelCatalog);
  const activeSessionIdRef = useRef<string | null>(null);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<string[]>([]);
  const [info, setInfo] = useState<string>('Connect to a bridge or use the stub-compatible flow while runtime integration is being tuned.');

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) ?? null, [projects, activeProjectId]);
  const currentProjectSessions = useMemo(
    () => sessions.filter((session) => session.projectId === activeProjectId),
    [sessions, activeProjectId],
  );
  const activeSessionId = useMemo(
    () => (activeProjectId ? activeSessionIdByProject[activeProjectId] ?? null : null),
    [activeProjectId, activeSessionIdByProject],
  );
  const activeSession = useMemo(() => {
    if (activeSessionId) {
      const matched = currentProjectSessions.find((session) => session.id === activeSessionId);
      if (matched) return matched;
    }
    if (activeProject?.defaultSessionId) {
      const projectDefault = currentProjectSessions.find((session) => session.id === activeProject.defaultSessionId);
      if (projectDefault) return projectDefault;
    }
    return currentProjectSessions[0] ?? null;
  }, [currentProjectSessions, activeProject, activeSessionId]);
  const resolvedActiveSessionId = activeSession?.id ?? null;
  const messages = useMemo(() => (resolvedActiveSessionId ? messagesBySessionId[resolvedActiveSessionId] || [] : []), [resolvedActiveSessionId, messagesBySessionId]);
  const activeApprovals = useMemo(() => (resolvedActiveSessionId ? approvalsBySessionId[resolvedActiveSessionId] || [] : []), [resolvedActiveSessionId, approvalsBySessionId]);
  const activeTaskStatus = useMemo(() => (resolvedActiveSessionId ? taskStatusBySessionId[resolvedActiveSessionId] || null : null), [resolvedActiveSessionId, taskStatusBySessionId]);
  const currentProjectSessionMeta = useMemo(() => Object.fromEntries(
    currentProjectSessions.map((session) => {
      const sessionMessages = messagesBySessionId[session.id] || [];
      const messageCount = sessionMessages.length;
      const turnCount = Math.ceil(messageCount / 2);
      const lastActivityLabel = sessionMessages[messageCount - 1]?.createdAt ? formatTime(sessionMessages[messageCount - 1]?.createdAt) : 'No activity yet';
      const changedFilesCount = session.lastTool === 'edit' ? 1 : /\.[a-z0-9]+/i.test(session.lastMessagePreview || '') ? 1 : 0;
      return [session.id, { messageCount, turnCount, lastActivityLabel, changedFilesCount }];
    }),
  ) as Record<string, { messageCount: number; turnCount: number; lastActivityLabel: string; changedFilesCount: number }>, [currentProjectSessions, messagesBySessionId]);
  const approvalsCountBySessionId = useMemo(() => Object.fromEntries(
    Object.entries(approvalsBySessionId).map(([sessionId, items]) => [sessionId, items.length]),
  ) as Record<string, number>, [approvalsBySessionId]);
  const activeAuthProfile = useMemo(
    () => authProfiles.find((profile) => profile.id === (activeSession?.authProfileId || activeProject?.authProfileId)) ?? null,
    [authProfiles, activeProject, activeSession],
  );
  const activeModel = useMemo(
    () => modelCatalog.find((model) => model.id === (activeSession?.modelId || activeProject?.defaultModelId)) ?? null,
    [activeProject, activeSession, modelCatalog],
  );
  const onboardingStep = getNextOnboardingStep({ endpoint, pairingCode, activeSessionId });
  const onboardingCopy = getOnboardingCopy(onboardingStep);
  const diagnostics = useMemo(() => ({
    activeProjectName: activeProject?.name || 'None',
    activeSessionId: resolvedActiveSessionId || 'None',
    endpoint,
    connectionState: mode,
    activeModel: activeModel?.label || 'Unassigned',
    runtimeStatus: activeSession?.status || 'idle',
    lastError: error || 'None',
    approvalPending: activeApprovals.length ? 'yes' : 'no',
  }), [activeProject, resolvedActiveSessionId, endpoint, mode, activeModel, activeSession, error, activeApprovals]);

  useEffect(() => {
    loadEndpoint().then((saved) => {
      if (!autoTestEnabled && saved) setEndpoint(saved);
    });
    loadPairingCode().then((saved) => saved && setPairingCode(saved));
    migrateLegacyProjectState().then(({ projects: savedProjects, activeProjectId: savedActiveProjectId, activeSessionIdByProject: savedSessionMap }) => {
      if (savedProjects.length) setProjects(savedProjects);
      if (savedActiveProjectId) setActiveProjectId(savedActiveProjectId);
      if (Object.keys(savedSessionMap).length) setActiveSessionMap((prev) => ({ ...prev, ...savedSessionMap }));
    });

    const off = bridgeClient.onEvent(handleEvent);
    return () => {
      off();
      bridgeClient.disconnect();
    };
  }, []);

  useEffect(() => {
    activeSessionIdRef.current = resolvedActiveSessionId;
  }, [resolvedActiveSessionId]);

  useEffect(() => {
    if (!activeProjectId || !activeSession?.id) return;
    if (activeSessionIdByProject[activeProjectId] === activeSession.id) return;
    const nextSessionMap = { ...activeSessionIdByProject, [activeProjectId]: activeSession.id };
    setActiveSessionMap(nextSessionMap);
    saveActiveSessionIdByProject(nextSessionMap).catch(() => {});
  }, [activeProjectId, activeSession, activeSessionIdByProject]);

  useEffect(() => {
    if (!autoTestEnabled || mode !== 'disconnected' || autoConnectAttemptedRef.current) return;
    autoConnectAttemptedRef.current = true;
    connect();
  }, [autoTestEnabled, mode]);

  async function persistProjectState(nextProjects: Project[], nextActiveProjectId: string | null, nextSessionMap?: ActiveSessionIdByProject) {
    await saveProjects(nextProjects);
    if (nextActiveProjectId) await saveActiveProjectId(nextActiveProjectId);
    if (nextSessionMap) await saveActiveSessionIdByProject(nextSessionMap);
  }

  function deriveSessionStatus(input: {
    eventStatus?: string | null;
    hasPendingApproval?: boolean;
    connectionMode?: 'disconnected' | 'connecting' | 'connected';
    explicitError?: boolean;
  }): ProjectSession['status'] {
    if (input.explicitError) return 'error';
    if (input.connectionMode === 'disconnected') return 'disconnected';
    if (input.hasPendingApproval) return 'waiting_approval';
    switch (input.eventStatus) {
      case 'waiting_approval':
        return 'waiting_approval';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      case 'error':
      case 'failed':
        return 'error';
      case 'disconnected':
        return 'disconnected';
      case 'completed':
      case 'complete':
      case 'idle':
        return 'idle';
      case 'running':
      case 'tool-use':
      case 'streaming':
      case 'working':
        return 'running';
      default:
        return 'idle';
    }
  }

  function patchSession(sessionId: string, patch: Partial<ProjectSession>) {
    setSessions((prev) => prev.map((session) => (session.id === sessionId ? { ...session, ...patch, updatedAt: patch.updatedAt || new Date().toISOString() } : session)));
  }

  function pushRecentEvent(label: string) {
    const stamped = `${new Date().toISOString()} · ${label}`;
    setRecentEvents((prev) => [stamped, ...prev].slice(0, 8));
  }

  function handleEvent(event: RpcEvent) {
    switch (event.method) {
      case 'connection.ready': {
        setMode('connected');
        setError(null);
        pushRecentEvent('connection.ready');
        if (resolvedActiveSessionId) {
          const activeApprovalCount = (approvalsBySessionId[resolvedActiveSessionId] || []).length;
          patchSession(resolvedActiveSessionId, { status: deriveSessionStatus({ hasPendingApproval: activeApprovalCount > 0, connectionMode: 'connected' }) });
        }
        setInfo('Bridge connected. You can create a session or resume recent work.');
        break;
      }
      case 'connection.closed': {
        setMode('disconnected');
        pushRecentEvent('connection.closed');
        if (resolvedActiveSessionId) patchSession(resolvedActiveSessionId, { status: deriveSessionStatus({ connectionMode: 'disconnected' }), lastError: 'Bridge disconnected' });
        setInfo('Bridge disconnected. Retry the connection or restart the bridge.');
        break;
      }
      case 'session.updated': {
        const params = event.params as SessionSummary | (ProjectSession & { projectId?: string; workspace?: string });
        const projectId = params.projectId || activeProjectId || projects[0]?.id || 'proj_demo';
        const session: ProjectSession = {
          ...params,
          projectId,
          workspacePath: params.workspacePath || params.workspace || projectWorkspace(activeProject),
        };
        setSessions((prev) => {
          const next = prev.filter((item) => item.id !== session.id);
          return [session, ...next].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        });
        break;
      }
      case 'message.delta': {
        const params = event.params as { projectId?: string; sessionId: string; messageId: string; textDelta: string };
        if (params.sessionId !== activeSessionIdRef.current) return;
        setMessagesBySessionId((prev) => {
          const current = prev[params.sessionId] || [];
          const existing = current.find((message) => message.id === params.messageId);
          const nextMessages: ChatMessage[] = !existing
            ? [...current, { id: params.messageId, sessionId: params.sessionId, role: 'assistant', text: params.textDelta, createdAt: new Date().toISOString(), pending: true }]
            : current.map((message) => (message.id === params.messageId ? { ...message, text: message.text + params.textDelta } : message));
          return { ...prev, [params.sessionId]: nextMessages };
        });
        break;
      }
      case 'message.done': {
        const params = event.params as { projectId?: string; sessionId: string; messageId: string };
        if (params.sessionId !== activeSessionIdRef.current) return;
        setMessagesBySessionId((prev) => ({
          ...prev,
          [params.sessionId]: (prev[params.sessionId] || []).map((message) => (message.id === params.messageId ? { ...message, pending: false } : message)),
        }));
        break;
      }
      case 'task.error': {
        const params = event.params as { message: string };
        setError(params.message);
        pushRecentEvent(`task.error: ${params.message}`);
        if (resolvedActiveSessionId) patchSession(resolvedActiveSessionId, { status: deriveSessionStatus({ explicitError: true }), lastError: params.message, lastMessagePreview: params.message });
        break;
      }
      case 'task.status': {
        const params = event.params as TaskStatusEvent;
        pushRecentEvent(`task.status: ${params.status}`);
        setTaskStatusBySessionId((prev) => ({ ...prev, [params.sessionId]: params }));
        patchSession(params.sessionId, {
          status: deriveSessionStatus({ eventStatus: params.status, explicitError: params.status === 'error' }),
          lastTool: params.tool || null,
          lastError: params.status === 'error' ? params.state?.output || error || 'runtime error' : params.status === 'cancelled' || params.status === 'canceled' ? 'Task cancelled' : null,
          lastMessagePreview: params.state?.title || params.state?.output || undefined,
        });
        setActivityExpanded(false);
        break;
      }
      case 'approval.requested': {
        const approval = event.params as ApprovalRequest;
        pushRecentEvent(`approval.requested: ${approval.title}`);
        setApprovalsBySessionId((prev) => ({
          ...prev,
          [approval.sessionId]: [approval, ...(prev[approval.sessionId] || []).filter((item) => item.id !== approval.id)],
        }));
        patchSession(approval.sessionId, {
          status: deriveSessionStatus({ hasPendingApproval: true }),
          lastMessagePreview: approval.title,
          consentState: null,
          lastError: null,
        });
        break;
      }
      case 'approval.resolved': {
        const approval = event.params as ApprovalRequest & { status?: string };
        pushRecentEvent(`approval.resolved: ${approval.status || 'updated'}`);
        setApprovalsBySessionId((prev) => ({
          ...prev,
          [approval.sessionId]: (prev[approval.sessionId] || []).filter((item) => item.id !== approval.id),
        }));
        patchSession(approval.sessionId, {
          status: approval.status === 'denied' ? deriveSessionStatus({ explicitError: true }) : deriveSessionStatus({ eventStatus: 'idle' }),
          consentState: {
            approved: approval.status !== 'denied',
            approvalId: approval.id,
            detail: approval.detail,
            updatedAt: new Date().toISOString(),
          },
          lastError: approval.status === 'denied' ? 'Approval denied' : null,
          lastMessagePreview: approval.status === 'denied' ? 'Approval denied' : 'Approval granted',
        });
        setInfo(`Approval ${approval.status || 'updated'}.`);
        break;
      }
    }
  }

  async function refreshHostInfo() {
    if (!bridgeClient.isConnected()) return;
    try {
      const result = await bridgeClient.request<{ host: HostHealth }>('connection.info');
      setHostHealth(result.host);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to load host info');
    }
  }

  async function connect() {
    try {
      setError(null);
      setMode('connecting');
      setInfo('Connecting to bridge…');
      await bridgeClient.connect(endpoint);
      await saveEndpoint(endpoint);
      const result = await bridgeClient.listSessions(activeProjectId ? { projectId: activeProjectId } : undefined);
      const nextSessions = result.sessions.length
        ? result.sessions.map((session) => ({ ...session, projectId: session.projectId || activeProjectId || activeProject?.id || 'proj_demo' }))
        : sampleProjectSessions;
      setSessions((prev) => {
        const keepOtherProjects = prev.filter((session) => session.projectId !== (activeProjectId || activeProject?.id));
        return [...keepOtherProjects, ...nextSessions];
      });
      setMode('connected');
      await refreshHostInfo();
      if (activeSessionId) {
        try {
          const resumed = await bridgeClient.resumeSession({ projectId: activeProjectId || undefined, sessionId: activeSessionId });
          setMessagesBySessionId((prev) => ({ ...prev, [resumed.session.id]: resumed.messages }));
          setApprovalsBySessionId((prev) => ({ ...prev, [resumed.session.id]: resumed.approvals || [] }));
        } catch {}
      }
    } catch (err) {
      setMode('disconnected');
      setError(err instanceof Error ? err.message : 'connection failed');
      setInfo('Bridge connection failed. You can still inspect the product shell and keep building the UX.');
    }
  }

  async function savePairing() {
    await savePairingCode(pairingCode);
    setInfo('Pairing code saved locally. QR scanning can hook into this field next.');
  }

  async function createProject(input: { name: string; workspacePath: string }) {
    const now = new Date().toISOString();
    const nextProject: Project = {
      id: `proj_${Date.now()}`,
      name: input.name,
      workspacePath: input.workspacePath,
      bridgeEndpoint: endpoint,
      defaultModelId: activeProject?.defaultModelId || activeModel?.id || null,
      authProfileId: activeProject?.authProfileId || activeAuthProfile?.id || null,
      defaultSessionId: null,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    };
    const nextProjects = [nextProject, ...projects.filter((project) => project.id !== nextProject.id)];
    const nextSessionMap = { ...activeSessionIdByProject, [nextProject.id]: null };
    setProjects(nextProjects);
    setActiveProjectId(nextProject.id);
    setActiveSessionMap(nextSessionMap);
    await persistProjectState(nextProjects, nextProject.id, nextSessionMap);
    setInfo(`Created project ${nextProject.name}.`);
    setScreen('workspace');
  }

  async function selectProject(projectId: string) {
    setActiveProjectId(projectId);
    const nextProjects = projects.map((project) => (
      project.id === projectId ? { ...project, lastOpenedAt: new Date().toISOString() } : project
    ));
    setProjects(nextProjects);
    await persistProjectState(nextProjects, projectId, activeSessionIdByProject);
    setInfo(`Switched to ${nextProjects.find((project) => project.id === projectId)?.name || 'project'}.`);
    setScreen('workspace');
  }

  async function selectModel(modelId: string) {
    if (!activeProjectId) return;
    const nextProjects = projects.map((project) => (
      project.id === activeProjectId ? { ...project, defaultModelId: modelId, updatedAt: new Date().toISOString() } : project
    ));
    setProjects(nextProjects);
    await persistProjectState(nextProjects, activeProjectId, activeSessionIdByProject);
    setInfo(`Model set to ${modelCatalog.find((model) => model.id === modelId)?.label || modelId}.`);
  }

  async function selectAuthProfile(authProfileId: string) {
    if (!activeProjectId) return;
    const nextProjects = projects.map((project) => (
      project.id === activeProjectId ? { ...project, authProfileId, updatedAt: new Date().toISOString() } : project
    ));
    setProjects(nextProjects);
    await persistProjectState(nextProjects, activeProjectId, activeSessionIdByProject);
    setInfo(`Auth profile switched.`);
  }

  function toggleAuthStatus(authProfileId: string) {
    setAuthProfiles((prev) => prev.map((profile) => (
      profile.id === authProfileId
        ? { ...profile, status: profile.status === 'connected' ? 'disconnected' : 'connected', lastValidatedAt: new Date().toISOString() }
        : profile
    )));
    setInfo('Auth profile state updated.');
  }

  async function applyScannedPayload(raw: string, source: 'camera' | 'simulation') {
    const parsed = parsePairingPayload(raw);
    if (!parsed.endpoint && !parsed.pairingCode) {
      setError('invalid QR payload: expected endpoint and/or pairingCode');
      setScannerHint('Unsupported QR format. Expected JSON like {"endpoint":"ws://host:7345","pairingCode":"PAIR-1234"}.');
      return;
    }
    setError(null);
    setScannerHint(null);
    if (parsed.endpoint) setEndpoint(parsed.endpoint);
    if (parsed.pairingCode) {
      setPairingCode(parsed.pairingCode);
      await savePairingCode(parsed.pairingCode);
    }
    setInfo(source === 'camera' ? 'QR import applied from camera scan.' : 'Simulated QR import applied.');
  }

  async function simulateQrScan() {
    await applyScannedPayload(SAMPLE_QR_PAYLOAD, 'simulation');
  }

  async function openQrScanner() {
    const result = cameraPermission?.granted ? cameraPermission : await requestCameraPermission();
    if (!result?.granted) {
      setError('camera permission is required for QR scanning');
      setScannerHint('Open system settings and allow camera access to scan pairing QR codes.');
      return;
    }
    setError(null);
    setScannerHint('Point the camera at a QR code containing endpoint and pairingCode.');
    setScannerOpen(true);
  }

  async function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (!scannerOpen) return;
    setScannerOpen(false);
    await applyScannedPayload(result.data, 'camera');
  }

  async function createSession(customWorkspace?: string) {
    try {
      setError(null);
      const projectId = activeProjectId || activeProject?.id || projects[0]?.id || 'proj_demo';
      const workspace = customWorkspace || projectWorkspace(activeProject);
      const correlationId = makeCorrelationId('create');
      await bridgeClient.log({ event: 'session.create.start', correlationId, projectId, activeSessionIdBefore: activeSessionId });
      const result = await bridgeClient.createSession({ projectId, workspace, correlationId });
      const nextSession: ProjectSession = {
        ...result.session,
        projectId,
        workspacePath: result.session.workspacePath || workspace,
        status: deriveSessionStatus({ eventStatus: result.session.status, hasPendingApproval: (result.approvals || []).length > 0, connectionMode: mode }),
      };
      setSessions((prev) => [nextSession, ...prev.filter((item) => item.id !== nextSession.id)]);
      setMessagesBySessionId((prev) => ({ ...prev, [nextSession.id]: result.messages }));
      setApprovalsBySessionId((prev) => ({ ...prev, [nextSession.id]: result.approvals || [] }));
      setTaskStatusBySessionId((prev) => ({ ...prev, [nextSession.id]: null }));
      const nextSessionMap = { ...activeSessionIdByProject, [projectId]: nextSession.id };
      setActiveSessionMap(nextSessionMap);
      await saveSessionId(nextSession.id, projectId);
      await bridgeClient.log({ event: 'session.create.success', correlationId, projectId, createdSessionId: nextSession.id });
      pushRecentEvent(`session.create: ${nextSession.id}`);
      setInfo('New session created. Send a prompt to start the task.');
      setScreen('workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to create session');
    }
  }

  async function selectSession(sessionId: string) {
    const projectId = activeProjectId || activeProject?.id || projects[0]?.id || 'proj_demo';
    if (!currentProjectSessions.some((session) => session.id === sessionId)) {
      setError('cannot resume a session outside the active project');
      return;
    }
    try {
      setError(null);
      const result = await bridgeClient.resumeSession({ projectId, sessionId });
      const session: ProjectSession = {
        ...result.session,
        projectId,
        workspacePath: result.session.workspacePath || projectWorkspace(activeProject),
        status: deriveSessionStatus({ eventStatus: result.session.status, hasPendingApproval: (result.approvals || []).length > 0, connectionMode: mode }),
      };
      setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)]);
      setMessagesBySessionId((prev) => ({ ...prev, [session.id]: result.messages }));
      setApprovalsBySessionId((prev) => ({ ...prev, [session.id]: result.approvals || [] }));
      setTaskStatusBySessionId((prev) => ({ ...prev, [session.id]: null }));
      const nextSessionMap = { ...activeSessionIdByProject, [projectId]: session.id };
      setActiveSessionMap(nextSessionMap);
      await saveSessionId(session.id, projectId);
      pushRecentEvent(`session.resume: ${session.id}`);
      setInfo(`Resumed ${session.title}.`);
      setScreen('workspace');
    } catch (err) {
      const nextSessionMap = { ...activeSessionIdByProject, [projectId]: sessionId };
      setActiveSessionMap(nextSessionMap);
      await saveSessionId(sessionId, projectId);
      setError(err instanceof Error ? err.message : 'failed to load session');
    }
  }

  async function sendMessage(forcedText?: string, forcedSessionId?: string) {
    const outgoing = (forcedText ?? draft).trim();
    const sessionId = forcedSessionId ?? activeSessionId;
    const projectId = activeProjectId || activeProject?.id || projects[0]?.id || 'proj_demo';
    if (!outgoing || !sessionId) return;
    const text = outgoing;
    const correlationId = makeCorrelationId('send');
    await bridgeClient.log({ event: 'message.send.start', correlationId, projectId, activeSessionId: sessionId, text });
    const userMessage: ChatMessage = { id: `local_${Date.now()}`, sessionId, role: 'user', text, createdAt: new Date().toISOString() };
    setMessagesBySessionId((prev) => ({ ...prev, [sessionId]: [...(prev[sessionId] || []), userMessage] }));
    setDraft('');
    try {
      patchSession(sessionId, { status: deriveSessionStatus({ eventStatus: 'running', connectionMode: mode }), lastMessagePreview: text, lastError: null });
      await bridgeClient.sendMessage({ projectId, sessionId, text, correlationId });
      pushRecentEvent(`message.send: ${sessionId}`);
      await bridgeClient.log({ event: 'message.send.success', correlationId, projectId, activeSessionId: sessionId, text });
      setInfo('Prompt sent. Waiting for runtime output…');
    } catch (err) {
      await bridgeClient.log({ event: 'message.send.failure', correlationId, projectId, activeSessionId: sessionId, error: err instanceof Error ? err.message : 'failed to send message' });
      setError(err instanceof Error ? err.message : 'failed to send message');
    }
  }

  async function cancelTask() {
    if (!resolvedActiveSessionId) return;
    try {
      patchSession(resolvedActiveSessionId, { status: deriveSessionStatus({ eventStatus: 'cancelled' }), lastError: null, lastMessagePreview: 'Task cancelled' });
      setTaskStatusBySessionId((prev) => ({
        ...prev,
        [resolvedActiveSessionId]: {
          ...(prev[resolvedActiveSessionId] || { sessionId: resolvedActiveSessionId, projectId: activeProjectId || undefined }),
          sessionId: resolvedActiveSessionId,
          projectId: activeProjectId || undefined,
          status: 'cancelled',
          state: { ...(prev[resolvedActiveSessionId]?.state || {}), title: 'Task cancelled', output: 'Cancellation requested from mobile client.' },
        },
      }));
      await bridgeClient.request('task.cancel', { projectId: activeProjectId || undefined, sessionId: resolvedActiveSessionId });
      pushRecentEvent(`task.cancel: ${resolvedActiveSessionId}`);
      setInfo('Cancel requested.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to cancel task');
      patchSession(resolvedActiveSessionId, { status: 'error', lastError: err instanceof Error ? err.message : 'failed to cancel task' });
    }
  }

  async function resolveApproval(approvalId: string, approved: boolean) {
    try {
      await bridgeClient.request('approval.respond', { approvalId, approved, projectId: activeProjectId || undefined });
      if (resolvedActiveSessionId) {
        setApprovalsBySessionId((prev) => ({
          ...prev,
          [resolvedActiveSessionId]: (prev[resolvedActiveSessionId] || []).filter((item) => item.id !== approvalId),
        }));
        patchSession(resolvedActiveSessionId, {
          status: approved ? deriveSessionStatus({ eventStatus: 'idle' }) : deriveSessionStatus({ explicitError: true }),
          consentState: { approved, approvalId, updatedAt: new Date().toISOString() },
          lastError: approved ? null : 'Approval denied',
          lastMessagePreview: approved ? 'Approval granted' : 'Approval denied',
        });
      }
      pushRecentEvent(`approval.respond: ${approved ? 'approved' : 'denied'}`);
      setInfo(approved ? 'Approval granted.' : 'Approval denied.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'failed to resolve approval');
    }
  }

  useEffect(() => {
    async function runAutoTest() {
      if (!autoTestEnabled || autoTestRan || mode !== 'connected') return;
      setAutoTestRan(true);
      try {
        const projectId = activeProjectId || activeProject?.id || projects[0]?.id || 'proj_demo';
        const result = await bridgeClient.createSession({
          projectId,
          workspace: projectWorkspace(activeProject),
          correlationId: makeCorrelationId('autotest-create'),
        });
        const session: ProjectSession = {
          ...result.session,
          projectId,
          workspacePath: result.session.workspacePath || projectWorkspace(activeProject),
          status: deriveSessionStatus({ eventStatus: result.session.status, hasPendingApproval: (result.approvals || []).length > 0, connectionMode: mode }),
        };
        setSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)]);
        setMessagesBySessionId((prev) => ({ ...prev, [session.id]: result.messages }));
        setApprovalsBySessionId((prev) => ({ ...prev, [session.id]: result.approvals || [] }));
        const nextSessionMap = { ...activeSessionIdByProject, [projectId]: session.id };
        setActiveSessionMap(nextSessionMap);
        await saveSessionId(session.id, projectId);
        await bridgeClient.log({ event: 'autotest.session.ready', projectId, sessionId: session.id, text: autoTestMessage });
        setTimeout(() => {
          setDraft(autoTestMessage);
          setTimeout(() => {
            sendMessage(autoTestMessage, session.id);
          }, 300);
        }, 300);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'autotest failed');
      }
    }
    runAutoTest();
  }, [autoTestEnabled, autoTestRan, mode]);

  const statusColor = mode === 'connected' ? colors.success : mode === 'connecting' ? colors.warn : colors.textMuted;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.keyboardSafe} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.topBarCopy}>
            <Text style={styles.title}>OpenCode Mobile</Text>
            <Text style={styles.subtitle}>{screen === 'workspace' ? 'Project-scoped session console' : screen === 'projects' ? 'Projects' : screen === 'modelsAuth' ? 'Models & auth' : 'Connection'}</Text>
          </View>
        </View>

        <View style={styles.primaryNavGrid}>
          <View style={styles.primaryNavCell}><GhostButton title="Work" icon="grid-outline" onPress={() => setScreen('workspace')} active={screen === 'workspace'} /></View>
          <View style={styles.primaryNavCell}><GhostButton title="Projects" icon="folder-open-outline" onPress={() => setScreen('projects')} active={screen === 'projects'} /></View>
          <View style={styles.primaryNavCell}><GhostButton title="Model" icon="sparkles-outline" onPress={() => setScreen('modelsAuth')} active={screen === 'modelsAuth'} /></View>
          <View style={styles.primaryNavCell}><GhostButton title="Conn" icon="git-network-outline" onPress={() => setScreen('connection')} active={screen === 'connection'} /></View>
        </View>

        {screen === 'workspace' ? (
          <ProjectWorkspaceScreen
            project={activeProject}
            activeSession={activeSession}
            sessions={currentProjectSessions}
            sessionMeta={currentProjectSessionMeta}
            approvalsBySessionId={approvalsCountBySessionId}
            messages={messages}
            approvals={activeApprovals}
            taskStatus={activeTaskStatus}
            connectionMode={mode}
            authProfile={activeAuthProfile}
            activeModel={activeModel}
            error={error}
            draft={draft}
            activityExpanded={activityExpanded}
            onToggleActivity={() => setActivityExpanded((prev) => !prev)}
            onDraftChange={setDraft}
            onSend={() => sendMessage()}
            onCancelTask={() => cancelTask()}
            onCreateSession={() => createSession()}
            onSelectSession={selectSession}
            onOpenProjects={() => setScreen('projects')}
            onOpenModelsAuth={() => setScreen('modelsAuth')}
            onOpenConnection={() => setScreen('connection')}
            onResolveApproval={resolveApproval}
          />
        ) : screen === 'projects' ? (
          <ProjectsScreen
            projects={projects}
            activeProjectId={activeProjectId}
            onSelectProject={selectProject}
            onCreateProject={createProject}
            onBack={() => setScreen('workspace')}
          />
        ) : screen === 'modelsAuth' ? (
          <ModelsAuthScreen
            project={activeProject}
            authProfiles={authProfiles}
            modelCatalog={modelCatalog}
            activeModelId={activeProject?.defaultModelId || activeModel?.id || null}
            activeAuthProfileId={activeProject?.authProfileId || activeAuthProfile?.id || null}
            onSelectModel={selectModel}
            onSelectAuthProfile={selectAuthProfile}
            onToggleAuthStatus={toggleAuthStatus}
            onBack={() => setScreen('workspace')}
          />
        ) : (
          <ConnectionScreen
            endpoint={endpoint}
            onChangeEndpoint={setEndpoint}
            onConnect={connect}
            onRefreshHost={refreshHostInfo}
            onOpenQrScanner={openQrScanner}
            onSimulateQr={simulateQrScan}
            onSavePairing={savePairing}
            pairingCode={pairingCode}
            onChangePairingCode={setPairingCode}
            mode={mode}
            info={info}
            error={error}
            hostHealth={hostHealth}
            scannerOpen={scannerOpen}
            scannerHint={scannerHint}
            scanner={scannerOpen ? <View style={styles.cameraFrame}><CameraView style={styles.camera} barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={handleBarcodeScanned} /></View> : null}
            onDismissScanner={() => { setScannerOpen(false); setScannerHint(null); }}
            diagnostics={diagnostics}
            recentEvents={recentEvents}
            onBack={() => setScreen('workspace')}
          />
        )}
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  keyboardSafe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10, gap: 10 },
  topBar: { gap: 8 },
  topBarCopy: { paddingRight: 4 },
  primaryNavGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2, marginBottom: 2, marginHorizontal: -4 },
  primaryNavCell: { width: '50%', paddingHorizontal: 4, paddingVertical: 4 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.textMuted, marginTop: 2, maxWidth: 220 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  actionsInline: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  sessionHeaderCopy: { flex: 1, paddingRight: 8 },
  chatPaneFull: { flex: 1 },
  settingsStack: { gap: 12, paddingBottom: 24 },
  hostGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  hostCell: { width: '48%', backgroundColor: colors.panelAlt, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#1f2937' },
  cameraFrame: { marginTop: 12, overflow: 'hidden', borderRadius: 16, borderWidth: 1, borderColor: '#1f2937', height: 280 },
  camera: { flex: 1 },
  hostLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  hostValue: { color: colors.text, fontWeight: '600' },
  badge: { marginTop: 4, fontWeight: '700' },
  infoText: { color: colors.textSoft, marginTop: 8, lineHeight: 20 },
  helperText: { color: colors.textMuted, marginTop: 8, fontSize: 12 },
  statusBlock: { minHeight: 104, justifyContent: 'flex-start' },
  error: { color: '#fca5a5', marginTop: 8, minHeight: 20 },
  statusPlaceholder: { marginTop: 8, minHeight: 20, color: 'transparent' },
  retryRow: { marginTop: 10, flexDirection: 'row', minHeight: 40 },
  retryPlaceholder: { height: 40 },
  metaPill: { color: colors.textSoft, backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 12 },
  runtimeMetaWrap: { marginTop: 10, gap: 4 },
  runtimeMeta: { color: colors.textMuted, fontSize: 12 },
  activityHeaderCopy: { flex: 1, paddingRight: 8 },
  activitySummary: { color: colors.textMuted, marginTop: 6, fontSize: 12, lineHeight: 18 },
  activityBody: { marginTop: 10 },
  activityOutputWrap: { marginTop: 8, maxHeight: 160, borderRadius: 12, backgroundColor: colors.panelAlt, borderWidth: 1, borderColor: '#1f2937' },
  activityOutputScroll: { paddingHorizontal: 10, paddingVertical: 2 },
  sessionItem: { padding: 10, borderRadius: 12, backgroundColor: colors.panelAlt, marginTop: 10, borderWidth: 1, borderColor: '#1e293b' },
  sessionItemActive: { borderColor: colors.primary },
  sessionTitle: { color: colors.text, fontWeight: '700' },
  sessionMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  preview: { color: colors.textSoft, marginTop: 6, fontSize: 12, lineHeight: 16 },
  approvalsWrap: { marginTop: 12, gap: 10 },
  approvalCard: { backgroundColor: '#221a0f', borderColor: '#5b3a00', borderWidth: 1, borderRadius: 14, padding: 12 },
  approvalTitle: { color: '#fde68a', fontWeight: '700' },
  approvalRisk: { color: '#fbbf24', fontSize: 12, fontWeight: '700' },
  approvalDetail: { color: '#fef3c7', marginTop: 6, marginBottom: 10, lineHeight: 18 },
  messages: { flex: 1 },
  messagesContent: { paddingBottom: 8 },
  emptyState: { paddingVertical: 32, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  emptyText: { color: colors.textMuted, marginTop: 8, textAlign: 'center', maxWidth: 360, lineHeight: 20 },
  messageBubble: { borderRadius: 14, padding: 12, marginBottom: 10, maxWidth: '92%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primarySoft },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#1f2937' },
  messageRole: { color: colors.textSoft, fontSize: 11, textTransform: 'uppercase', marginBottom: 6 },
  messageTime: { color: colors.textMuted, fontSize: 11 },
  messageText: { color: colors.text, lineHeight: 20 },
  composer: { gap: 10, marginTop: 8 },
  composerInput: { minHeight: 80, textAlignVertical: 'top' },
});
