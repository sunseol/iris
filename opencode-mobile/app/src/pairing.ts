import { QrScanResult } from './qr-placeholder';

export type PairingValidationResult =
  | { ok: true; normalizedEndpoint: string }
  | { ok: false; reason: 'invalid payload' | 'invalid version' | 'expired QR' | 'invalid endpoint' | 'auth/token mismatch' };

export type TrustedHost = {
  hostId: string;
  label: string;
  endpoint: string;
  pairingToken?: string;
  expiresAt?: string;
  version: number;
  lastConnectedAt: string;
};

const SUPPORTED_VERSION = 1;

export function validatePairingPayload(payload: QrScanResult): PairingValidationResult {
  if (payload.type && payload.type !== 'opencode-bridge') return { ok: false, reason: 'invalid payload' };
  if (!payload.endpoint) return { ok: false, reason: 'invalid payload' };
  if (typeof payload.version === 'number' && payload.version !== SUPPORTED_VERSION) return { ok: false, reason: 'invalid version' };
  if (payload.expiresAt && new Date(payload.expiresAt).getTime() < Date.now()) return { ok: false, reason: 'expired QR' };
  try {
    const url = new URL(payload.endpoint);
    if (!['ws:', 'wss:'].includes(url.protocol)) {
      return { ok: false, reason: 'invalid endpoint' };
    }
  } catch {
    return { ok: false, reason: 'invalid endpoint' };
  }
  return { ok: true, normalizedEndpoint: payload.endpoint };
}

export function buildPairedEndpoint(payload: QrScanResult) {
  if (!payload.endpoint) return null;
  const url = new URL(payload.endpoint);
  if (payload.pairingToken) url.searchParams.set('pairingToken', payload.pairingToken);
  if (payload.expiresAt) url.searchParams.set('expiresAt', payload.expiresAt);
  if (payload.hostId) url.searchParams.set('hostId', payload.hostId);
  url.searchParams.set('version', String(payload.version || SUPPORTED_VERSION));
  return url.toString();
}

export function toTrustedHost(payload: QrScanResult): TrustedHost | null {
  if (!payload.endpoint || !payload.hostId) return null;
  return {
    hostId: payload.hostId,
    label: payload.label || payload.hostId,
    endpoint: payload.endpoint,
    pairingToken: payload.pairingToken || payload.pairingCode,
    expiresAt: payload.expiresAt,
    version: payload.version || SUPPORTED_VERSION,
    lastConnectedAt: new Date().toISOString(),
  };
}

export function classifyConnectionError(message: string | null | undefined) {
  const text = String(message || '').toLowerCase();
  if (text.includes('expired')) return 'expired QR';
  if (text.includes('auth/token mismatch') || text.includes('host mismatch') || text.includes('pairing rejected')) return 'auth/token mismatch';
  if (text.includes('timeout')) return 'tunnel unreachable';
  if (text.includes('failed')) return 'bridge offline';
  return 'invalid payload';
}
