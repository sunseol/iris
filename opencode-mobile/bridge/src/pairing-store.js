import fs from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'pairing-store.json');

export async function writePairingStore(record) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(record, null, 2), 'utf8');
  return STORE_PATH;
}

export async function readPairingStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function validatePairingRecord(record, candidate) {
  if (!record) {
    return { ok: true, reason: null };
  }
  if (!candidate?.pairingToken) {
    return { ok: false, reason: 'auth/token mismatch' };
  }
  if (record.version && candidate.version && Number(candidate.version) !== Number(record.version)) {
    return { ok: false, reason: 'invalid version' };
  }
  if (record.hostId && candidate.hostId && candidate.hostId !== record.hostId) {
    return { ok: false, reason: 'host mismatch' };
  }
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: 'expired token' };
  }
  if (candidate.expiresAt && new Date(candidate.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: 'expired token' };
  }
  if (candidate.pairingToken !== record.pairingToken) {
    return { ok: false, reason: 'auth/token mismatch' };
  }
  return { ok: true, reason: null };
}
