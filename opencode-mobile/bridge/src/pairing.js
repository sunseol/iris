import os from 'node:os';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import localtunnel from 'localtunnel';
import QRCode from 'qrcode';
import qrcodeTerminal from 'qrcode-terminal';
import { writePairingStore } from './pairing-store.js';

const DEFAULT_PORT = Number(process.env.PORT || 7345);
const DEFAULT_VERSION = 1;
const DATA_DIR = path.resolve(process.cwd(), 'data');

function hostLabel() {
  return process.env.OPENCODE_BRIDGE_LABEL || os.hostname();
}

function hostId() {
  return process.env.OPENCODE_BRIDGE_HOST_ID || crypto.createHash('sha1').update(os.hostname()).digest('hex').slice(0, 12);
}

function defaultPairingToken() {
  return process.env.OPENCODE_PAIRING_TOKEN || crypto.randomBytes(9).toString('base64url');
}

function expiresAtIso(minutes) {
  if (!minutes || Number.isNaN(minutes)) return undefined;
  const value = new Date(Date.now() + minutes * 60_000);
  return value.toISOString();
}

export function buildPairingPayload({
  endpoint,
  label = hostLabel(),
  hostId: bridgeHostId = hostId(),
  pairingToken,
  expiresAt,
  projectHint,
  version = DEFAULT_VERSION,
}) {
  return {
    type: 'opencode-bridge',
    endpoint,
    label,
    hostId: bridgeHostId,
    createdAt: new Date().toISOString(),
    ...(pairingToken ? { pairingToken } : {}),
    ...(expiresAt ? { expiresAt } : {}),
    ...(projectHint ? { projectHint } : {}),
    version,
  };
}

export async function createTunnel({ port = DEFAULT_PORT, subdomain } = {}) {
  const tunnel = await localtunnel({ port, ...(subdomain ? { subdomain } : {}) });
  const endpoint = tunnel.url.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  return { tunnel, endpoint, publicUrl: tunnel.url };
}

export async function writePairingArtifacts(payload, { outputDir = DATA_DIR } = {}) {
  await fs.mkdir(outputDir, { recursive: true });
  const payloadJson = JSON.stringify(payload, null, 2);
  const qrDataUrl = await QRCode.toDataURL(payloadJson, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <title>OpenCode Bridge Pairing</title>
    <style>
      body { font-family: system-ui, sans-serif; background:#0f172a; color:#e2e8f0; margin:0; padding:32px; }
      .card { max-width:720px; margin:0 auto; background:#111827; border:1px solid #334155; border-radius:24px; padding:24px; }
      img { width:320px; height:320px; background:white; border-radius:16px; display:block; }
      pre { white-space:pre-wrap; word-break:break-word; background:#020617; padding:16px; border-radius:16px; }
      .muted { color:#94a3b8; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>OpenCode Bridge QR Pairing</h1>
      <p class="muted">모바일 앱에서 QR을 스캔하면 endpoint와 pairing 정보가 자동 등록됩니다.</p>
      <img src="${qrDataUrl}" alt="OpenCode Bridge Pairing QR" />
      <h2>Payload</h2>
      <pre>${payloadJson}</pre>
    </div>
  </body>
</html>`;

  const jsonPath = path.join(outputDir, 'pairing-latest.json');
  const htmlPath = path.join(outputDir, 'pairing-latest.html');
  await fs.writeFile(jsonPath, payloadJson, 'utf8');
  await fs.writeFile(htmlPath, html, 'utf8');
  return { jsonPath, htmlPath, qrDataUrl };
}

export function printPairingQr(payload) {
  qrcodeTerminal.generate(JSON.stringify(payload), { small: true });
}

export async function createPairingSession({
  port = DEFAULT_PORT,
  subdomain,
  pairingToken = defaultPairingToken(),
  expiresInMinutes = process.env.OPENCODE_PAIRING_EXPIRES_MINUTES ? Number(process.env.OPENCODE_PAIRING_EXPIRES_MINUTES) : 30,
  projectHint = process.env.OPENCODE_PROJECT_HINT,
  outputDir = DATA_DIR,
} = {}) {
  const { tunnel, endpoint, publicUrl } = await createTunnel({ port, subdomain });
  const expiresAt = expiresAtIso(expiresInMinutes);
  const bridgeHostId = hostId();
  const payload = buildPairingPayload({
    endpoint,
    hostId: bridgeHostId,
    pairingToken,
    expiresAt,
    projectHint,
  });
  const artifacts = await writePairingArtifacts(payload, { outputDir });
  const storePath = await writePairingStore({
    pairingToken,
    expiresAt,
    hostId: bridgeHostId,
    endpoint,
    version: payload.version,
    createdAt: payload.createdAt,
  });
  return { tunnel, endpoint, publicUrl, payload, artifacts: { ...artifacts, storePath } };
}
