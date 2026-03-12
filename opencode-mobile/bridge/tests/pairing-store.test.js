import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePairingRecord } from '../src/pairing-store.js';

test('validatePairingRecord accepts matching token', () => {
  const result = validatePairingRecord(
    { pairingToken: 'PAIR-1', hostId: 'host-a', version: 1, expiresAt: '2099-01-01T00:00:00.000Z' },
    { pairingToken: 'PAIR-1', hostId: 'host-a', version: 1 }
  );
  assert.equal(result.ok, true);
});

test('validatePairingRecord rejects expired token', () => {
  const result = validatePairingRecord(
    { pairingToken: 'PAIR-1', hostId: 'host-a', version: 1, expiresAt: '2000-01-01T00:00:00.000Z' },
    { pairingToken: 'PAIR-1', hostId: 'host-a', version: 1 }
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'expired token');
});

test('validatePairingRecord rejects mismatched token', () => {
  const result = validatePairingRecord(
    { pairingToken: 'PAIR-1', hostId: 'host-a', version: 1, expiresAt: '2099-01-01T00:00:00.000Z' },
    { pairingToken: 'PAIR-2', hostId: 'host-a', version: 1 }
  );
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'auth/token mismatch');
});
