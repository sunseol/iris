import test from 'node:test';
import assert from 'node:assert/strict';
import { formatStatus, formatRisk } from '../src/format';
import { getNextOnboardingStep } from '../src/onboarding';
import { parsePairingPayload } from '../src/qr-placeholder';

test('format helpers capitalize values', () => {
  assert.equal(formatStatus('connected'), 'Connected');
  assert.equal(formatRisk('high'), 'High');
});

test('onboarding prefers pairing after endpoint exists', () => {
  assert.equal(getNextOnboardingStep({ endpoint: 'ws://host:7345', pairingCode: '', activeSessionId: null }), 'pairing');
});

test('qr payload parser extracts endpoint and pairing code', () => {
  const parsed = parsePairingPayload('{"endpoint":"ws://demo:7345","pairingCode":"PAIR-42"}');
  assert.equal(parsed.endpoint, 'ws://demo:7345');
  assert.equal(parsed.pairingCode, 'PAIR-42');
});

test('qr payload parser supports opencode-bridge tunnel payload', () => {
  const parsed = parsePairingPayload('{"type":"opencode-bridge","endpoint":"wss://bridge.example.com","label":"host-a","pairingToken":"PAIR-88","version":1}');
  assert.equal(parsed.type, 'opencode-bridge');
  assert.equal(parsed.endpoint, 'wss://bridge.example.com');
  assert.equal(parsed.pairingCode, 'PAIR-88');
  assert.equal(parsed.label, 'host-a');
  assert.equal(parsed.version, 1);
});

test('qr payload parser also supports legacy key-value text', () => {
  const parsed = parsePairingPayload('endpoint=ws://demo:7345;pairing=PAIR-77');
  assert.equal(parsed.endpoint, 'ws://demo:7345');
  assert.equal(parsed.pairingCode, 'PAIR-77');
});

test('qr payload parser returns empty object for malformed input', () => {
  const parsed = parsePairingPayload('not-a-valid-payload');
  assert.deepEqual(parsed, {});
});
