import test from 'node:test';
import assert from 'node:assert/strict';
import { createRuntimeParser } from '../src/runtime-parser.js';

test('runtime parser keeps generic stderr as non-approval', () => {
  let approval = null;
  const parser = createRuntimeParser({
    onApprovalRequested(value) {
      approval = value;
    },
  });

  const result = parser.parseChunk('sess_1', 'stderr', 'Need approval to run bash command');
  assert.equal(result.kind, 'stderr');
  assert.equal(approval, null);
});

test('runtime parser detects assistant boundaries', () => {
  let boundaryCount = 0;
  const parser = createRuntimeParser({
    onAssistantBoundary() {
      boundaryCount += 1;
    },
  });

  const result = parser.parseChunk('sess_1', 'stdout', '{"type":"step_finish"}\n');
  assert.equal(result.kind, 'assistant-boundary');
  assert.equal(boundaryCount, 1);
});

test('runtime parser strips think tags from opencode text events', () => {
  let output = '';
  const parser = createRuntimeParser({
    onAssistantText(_sid, text) {
      output += text;
    },
  });

  parser.parseChunk('sess_1', 'stdout', '{"type":"text","part":{"text":"<think>hidden</think>\\n\\nHello!"}}\n');
  assert.equal(output, 'Hello!');
});

test('runtime parser captures runtime session and tool use', () => {
  let runtimeSession = null;
  let tool = null;
  const parser = createRuntimeParser({
    onRuntimeSession(_sid, value) {
      runtimeSession = value;
    },
    onToolUse(_sid, value) {
      tool = value;
    },
  });

  parser.parseChunk('sess_1', 'stdout', '{"type":"tool_use","sessionID":"ses_real","part":{"tool":"bash","callID":"abc","state":{"status":"completed"}}}\n');
  assert.equal(runtimeSession, 'ses_real');
  assert.equal(tool?.tool, 'bash');
  assert.equal(tool?.callID, 'abc');
});

test('runtime parser detects approval from assistant text', () => {
  let approval = null;
  const parser = createRuntimeParser({
    onApprovalRequested(value) {
      approval = value;
    },
  });

  parser.parseChunk('sess_1', 'stdout', '{"type":"text","part":{"text":"Would you like me to run any further commands? Please let me know what you\'d like to do next."}}\n');
  assert.equal(approval?.sessionId, 'sess_1');
  assert.equal(approval?.title, 'Runtime approval requested');
});

test('runtime parser does not treat ordinary output as approval', () => {
  let approval = null;
  const parser = createRuntimeParser({
    onApprovalRequested(value) {
      approval = value;
    },
  });

  parser.parseChunk('sess_1', 'stdout', '{"type":"text","part":{"text":"APPROVED_BY_USER"}}\n');
  assert.equal(approval, null);
});
