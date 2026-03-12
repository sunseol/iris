import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const logPath = process.env.OPENCODE_BRIDGE_DIAGNOSTIC_LOG || '/home/jakeseol/.openclaw/workspace/opencode-mobile/bridge/data/diagnostic.log';

export function writeDiagnostic(entry) {
  mkdirSync(dirname(logPath), { recursive: true });
  appendFileSync(logPath, JSON.stringify({ time: new Date().toISOString(), ...entry }) + '\n');
}

export function getDiagnosticLogPath() {
  return logPath;
}
