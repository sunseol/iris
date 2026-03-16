import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ActiveSessionIdByProject, Project } from './types';

// expo-secure-store is native-only; fall back to localStorage on web.
async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    try { localStorage.setItem(key, value); } catch { /* noop */ }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

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
  await setItem(ENDPOINT_KEY, endpoint);
}

export async function loadEndpoint() {
  return getItem(ENDPOINT_KEY);
}

export async function savePairingCode(pairingCode: string) {
  await setItem(PAIRING_KEY, pairingCode);
}

export async function loadPairingCode() {
  return getItem(PAIRING_KEY);
}

export async function saveProjects(projects: Project[]) {
  await setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export async function loadProjects() {
  const saved = parseJson<Project[]>(await getItem(PROJECTS_KEY));
  if (saved?.length) return saved;
  return null;
}

export async function saveActiveProjectId(projectId: string) {
  await setItem(ACTIVE_PROJECT_KEY, projectId);
}

export async function loadActiveProjectId() {
  return getItem(ACTIVE_PROJECT_KEY);
}

export async function saveActiveSessionIdByProject(activeSessionIdByProject: ActiveSessionIdByProject) {
  await setItem(ACTIVE_SESSIONS_BY_PROJECT_KEY, JSON.stringify(activeSessionIdByProject));
}

export async function loadActiveSessionIdByProject() {
  const saved = parseJson<ActiveSessionIdByProject>(await getItem(ACTIVE_SESSIONS_BY_PROJECT_KEY));
  if (saved) return saved;
  return null;
}

export async function migrateLegacyProjectState() {
  const [savedProjects, savedActiveProjectId, savedSessionsByProject, legacyEndpoint, legacySessionId] = await Promise.all([
    loadProjects(),
    loadActiveProjectId(),
    loadActiveSessionIdByProject(),
    loadEndpoint(),
    getItem(SESSION_KEY),
  ]);

  if (savedProjects?.length && savedActiveProjectId && savedSessionsByProject) {
    // Clear stale sample data left over from pre-mapping era
    const hasStale = savedProjects.some((p) => STALE_SAMPLE_PROJECT_IDS.includes(p.id));
    if (!hasStale) {
      return {
        projects: savedProjects,
        activeProjectId: savedActiveProjectId,
        activeSessionIdByProject: savedSessionsByProject,
      };
    }
    // Fall through to re-create clean default project
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
    setItem(SESSION_KEY, sessionId),
    saveActiveSessionIdByProject(next),
    saveActiveProjectId(projectId),
  ]);
}

export async function loadSessionId(projectId?: string) {
  const current = await loadActiveSessionIdByProject();
  if (projectId && current?.[projectId]) return current[projectId];
  const activeProjectId = await loadActiveProjectId();
  if (activeProjectId && current?.[activeProjectId]) return current[activeProjectId];
  return getItem(SESSION_KEY);
}

const STALE_SAMPLE_PROJECT_IDS = ['proj_demo', 'proj_mobile'];

/** Wipe all persisted state — useful when stale sample data is cached. */
export async function clearAllStorage(): Promise<void> {
  const keys = [ENDPOINT_KEY, SESSION_KEY, PAIRING_KEY, PROJECTS_KEY, ACTIVE_PROJECT_KEY, ACTIVE_SESSIONS_BY_PROJECT_KEY];
  await Promise.all(keys.map((k) => setItem(k, '')));
}

