import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryOpenCodeAdapter } from '../src/stub-adapter.js';

test('stub adapter exposes seeded approvals', () => {
  const adapter = new InMemoryOpenCodeAdapter();
  const approvals = adapter.listApprovals('sess_demo');
  assert.equal(approvals.length, 1);
  assert.equal(approvals[0].status, 'pending');
});

test('stub adapter resolves approval state', () => {
  const adapter = new InMemoryOpenCodeAdapter();
  const resolved = adapter.respondToApproval('approval_demo_1', true);
  assert.equal(resolved.status, 'approved');
});
