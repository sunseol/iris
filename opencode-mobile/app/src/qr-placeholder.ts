export type QrScanResult = {
  endpoint?: string;
  pairingCode?: string;
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
  const pairingCode = typeof value.pairingCode === 'string' ? value.pairingCode : undefined;
  return compactResult({ endpoint, pairingCode });
}

function parseLegacyPairingString(raw: string): QrScanResult {
  const endpointMatch = raw.match(/endpoint=([^;\n]+)/i);
  const pairingMatch = raw.match(/pairing(?:Code)?=([^;\n]+)/i);
  return compactResult({
    endpoint: endpointMatch?.[1],
    pairingCode: pairingMatch?.[1],
  });
}

function compactResult(result: QrScanResult): QrScanResult {
  const next: QrScanResult = {};
  if (result.endpoint) next.endpoint = result.endpoint;
  if (result.pairingCode) next.pairingCode = result.pairingCode;
  return next;
}
