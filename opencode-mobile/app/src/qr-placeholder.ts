export type QrScanResult = {
  type?: string;
  endpoint?: string;
  label?: string;
  hostId?: string;
  createdAt?: string;
  pairingCode?: string;
  pairingToken?: string;
  expiresAt?: string;
  projectHint?: string;
  version?: number;
};

export function parsePairingPayload(raw: string): QrScanResult {
  try {
    const parsed = JSON.parse(raw);
    return normalizePairingPayload(parsed);
  } catch {
    return parseLegacyPairingString(raw);
  }
}

function normalizePairingPayload(parsed: unknown): QrScanResult {
  if (!parsed || typeof parsed !== 'object') return {};
  const value = parsed as Record<string, unknown>;
  const endpoint = typeof value.endpoint === 'string' ? value.endpoint : undefined;
  const pairingCode = typeof value.pairingCode === 'string'
    ? value.pairingCode
    : typeof value.pairingToken === 'string'
      ? value.pairingToken
      : undefined;

  return compactResult({
    type: typeof value.type === 'string' ? value.type : undefined,
    endpoint,
    label: typeof value.label === 'string' ? value.label : undefined,
    hostId: typeof value.hostId === 'string' ? value.hostId : undefined,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : undefined,
    pairingCode,
    pairingToken: typeof value.pairingToken === 'string' ? value.pairingToken : undefined,
    expiresAt: typeof value.expiresAt === 'string' ? value.expiresAt : undefined,
    projectHint: typeof value.projectHint === 'string' ? value.projectHint : undefined,
    version: typeof value.version === 'number' ? value.version : undefined,
  });
}

function parseLegacyPairingString(raw: string): QrScanResult {
  const endpointMatch = raw.match(/endpoint=([^;\n]+)/i);
  const pairingMatch = raw.match(/pairing(?:Code|Token)?=([^;\n]+)/i);
  return compactResult({
    endpoint: endpointMatch?.[1],
    pairingCode: pairingMatch?.[1],
  });
}

function compactResult(result: QrScanResult): QrScanResult {
  const next: QrScanResult = {};
  if (result.type) next.type = result.type;
  if (result.endpoint) next.endpoint = result.endpoint;
  if (result.label) next.label = result.label;
  if (result.hostId) next.hostId = result.hostId;
  if (result.createdAt) next.createdAt = result.createdAt;
  if (result.pairingCode) next.pairingCode = result.pairingCode;
  if (result.pairingToken) next.pairingToken = result.pairingToken;
  if (result.expiresAt) next.expiresAt = result.expiresAt;
  if (result.projectHint) next.projectHint = result.projectHint;
  if (typeof result.version === 'number') next.version = result.version;
  return next;
}
