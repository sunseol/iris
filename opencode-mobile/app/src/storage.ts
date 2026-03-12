import * as SecureStore from 'expo-secure-store';
import { ActiveSessionIdByProject, Project } from './types';

const ENDPOINT_KEY = 'opencode.endpoint';
const SESSION_KEY = 'opencode.session';
const PAIRING_KEY = 'opencode.pairingCode';
const PROJECTS_KEY = 'opencode.projects';
const ACTIVE_PROJECT_KEY = 'opencode.activeProject';
const ACTIVE_SESSIONS_BY_PROJECT_KEY = 'opencode.activeSessionsByProject';

const LEGACY_PROJECT_ID = 'proj_legacy_default';

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function makeLegacyProject(endpoint?: string | null, sessionId?: string | null): Project {
  const now = new Date().toISOString();
  return {
    id: LEGACY_PROJECT_ID,
    name: 'Default project',
    workspacePath: '/home/jakeseol/.openclaw/workspace',
    bridgeEndpoint: endpoint || undefined,
    defaultSessionId: sessionId || null,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  };
}

export async function saveEndpoint(endpoint: string) {
  await SecureStore.setItemAsync(ENDPOINT_KEY, endpoint);
}

export async function loadEndpoint() {
  return SecureStore.getItemAsync(ENDPOINT_KEY);
}

export async function savePairingCode(pairingCode: string) {
  await SecureStore.setItemAsync(PAIRING_KEY, pairingCode);
}

export async function loadPairingCode() {
  return SecureStore.getItemAsync(PAIRING_KEY);
}

export async function saveProjects(projects: Project[]) {
  await SecureStore.setItemAsync(PROJECTS_KEY, JSON.stringify(projects));
}

export async function loadProjects() {
  const saved = parseJson<Project[]>(await SecureStore.getItemAsync(PROJECTS_KEY));
  if (saved?.length) return saved;
  return null;
}

export async function saveActiveProjectId(projectId: string) {
  await SecureStore.setItemAsync(ACTIVE_PROJECT_KEY, projectId);
}

export async function loadActiveProjectId() {
  return SecureStore.getItemAsync(ACTIVE_PROJECT_KEY);
}

export async function saveActiveSessionIdByProject(activeSessionIdByProject: ActiveSessionIdByProject) {
  await SecureStore.setItemAsync(ACTIVE_SESSIONS_BY_PROJECT_KEY, JSON.stringify(activeSessionIdByProject));
}

export async function loadActiveSessionIdByProject() {
  const saved = parseJson<ActiveSessionIdByProject>(await SecureStore.getItemAsync(ACTIVE_SESSIONS_BY_PROJECT_KEY));
  if (saved) return saved;
  return null;
}

export async function migrateLegacyProjectState() {
  const [savedProjects, savedActiveProjectId, savedSessionsByProject, legacyEndpoint, legacySessionId] = await Promise.all([
    loadProjects(),
    loadActiveProjectId(),
    loadActiveSessionIdByProject(),
    loadEndpoint(),
    SecureStore.getItemAsync(SESSION_KEY),
  ]);

  if (savedProjects?.length && savedActiveProjectId && savedSessionsByProject) {
    return {
      projects: savedProjects,
      activeProjectId: savedActiveProjectId,
      activeSessionIdByProject: savedSessionsByProject,
    };
  }

  const legacyProject = makeLegacyProject(legacyEndpoint, legacySessionId);
  const projects = savedProjects?.length ? savedProjects : [legacyProject];
  const activeProjectId = savedActiveProjectId || projects[0]?.id || LEGACY_PROJECT_ID;
  const activeSessionIdByProject = savedSessionsByProject || {
    [activeProjectId]: legacySessionId || projects[0]?.defaultSessionId || null,
  };

  await Promise.all([
    saveProjects(projects),
    saveActiveProjectId(activeProjectId),
    saveActiveSessionIdByProject(activeSessionIdByProject),
  ]);

  return { projects, activeProjectId, activeSessionIdByProject };
}

// Compatibility wrappers for pre-migration callers.
export async function saveSessionId(sessionId: string, projectId = LEGACY_PROJECT_ID) {
  const current = (await loadActiveSessionIdByProject()) || {};
  const next = { ...current, [projectId]: sessionId };
  await Promise.all([
    SecureStore.setItemAsync(SESSION_KEY, sessionId),
    saveActiveSessionIdByProject(next),
    saveActiveProjectId(projectId),
  ]);
}

export async function loadSessionId(projectId?: string) {
  const current = await loadActiveSessionIdByProject();
  if (projectId && current?.[projectId]) return current[projectId];
  const activeProjectId = await loadActiveProjectId();
  if (activeProjectId && current?.[activeProjectId]) return current[activeProjectId];
  return SecureStore.getItemAsync(SESSION_KEY);
}
