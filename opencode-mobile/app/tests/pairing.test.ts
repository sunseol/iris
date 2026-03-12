import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPairedEndpoint, classifyConnectionError, toTrustedHost, validatePairingPayload } from '../src/pairing';

test('validatePairingPayload accepts valid v1 opencode bridge payload', () => {
  const result = validatePairingPayload({
    type: 'opencode-bridge',
    endpoint: 'wss://bridge.example.com',
    pairingToken: 'PAIR-1',
    hostId: 'host-1',
    version: 1,
  });
  assert.equal(result.ok, true);
});

test('validatePairingPayload rejects expired payload', () => {
  const result = validatePairingPayload({
    type: 'opencode-bridge',
    endpoint: 'wss://bridge.example.com',
    expiresAt: '2000-01-01T00:00:00.000Z',
    version: 1,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'expired QR');
});

test('buildPairedEndpoint appends token metadata', () => {
  const value = buildPairedEndpoint({
    endpoint: 'wss://bridge.example.com',
    pairingToken: 'PAIR-77',
    hostId: 'host-a',
    expiresAt: '2099-01-01T00:00:00.000Z',
    version: 1,
  });
  assert.match(String(value), /pairingToken=PAIR-77/);
  assert.match(String(value), /hostId=host-a/);
  assert.match(String(value), /version=1/);
});

test('toTrustedHost creates reusable recent connection entry', () => {
  const host = toTrustedHost({
    endpoint: 'wss://bridge.example.com',
    hostId: 'host-a',
    label: 'dev host',
    pairingToken: 'PAIR-77',
    version: 1,
  });
  assert.equal(host?.hostId, 'host-a');
  assert.equal(host?.label, 'dev host');
});

test('classifyConnectionError separates common pairing failures', () => {
  assert.equal(classifyConnectionError('bridge connection timeout'), 'tunnel unreachable');
  assert.equal(classifyConnectionError('auth/token mismatch'), 'auth/token mismatch');
  assert.equal(classifyConnectionError('expired token'), 'expired QR');
});
