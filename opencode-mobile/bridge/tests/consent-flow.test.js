import test from 'node:test';
import assert from 'node:assert/strict';
import { ProcessBackedOpenCodeAdapter } from '../src/runtime-adapter.js';

test('approval respond stores consent state on session', () => {
  const adapter = new ProcessBackedOpenCodeAdapter({ command: 'opencode', args: ['run', '--format', 'json'] });
  const session = adapter.createSession('/tmp');
  adapter.approvals.set('approval_1', {
    id: 'approval_1',
    sessionId: session.id,
    detail: 'Do you approve running any further commands?',
    status: 'pending',
  });

  const resolved = adapter.respondToApproval('approval_1', true, {});
  const updated = adapter.requireSession(session.id);

  assert.equal(resolved.status, 'approved');
  assert.equal(updated.consentState.approved, true);
  assert.equal(updated.consentState.approvalId, 'approval_1');
});
