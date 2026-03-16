function now() {
  return new Date().toISOString();
}

export function createRuntimeParser(handlers = {}) {
  let currentApproval = null;
  let buffered = '';

  function parseChunk(sessionId, source, chunk) {
    const text = String(chunk);

    if (source === 'stderr') {
      // Skip non-error noise from OpenCode startup (config warnings, bun install, etc.)
      if (looksLikeStartupNoise(text)) {
        return { kind: 'noise', text };
      }
      if (looksLikeApproval(text)) {
        currentApproval = {
          id: `approval_${Date.now()}`,
          sessionId,
          title: 'Runtime approval required',
          detail: text.trim(),
          createdAt: now(),
          risk: classifyRisk(text),
          status: 'pending',
        };
        handlers.onApprovalRequested?.(currentApproval);
        return { kind: 'approval', approval: currentApproval };
      }

      handlers.onTaskError?.(sessionId, text);
      return { kind: 'stderr', text };
    }

    buffered += text;
    const lines = buffered.split(/\r?\n/);
    buffered = lines.pop() ?? '';

    let sawStructuredBoundary = false;
    for (const line of lines) {
      const parsed = tryParseJson(line);
      if (parsed) {
        const result = handleStructuredEvent(sessionId, parsed, handlers, {
          get currentApproval() {
            return currentApproval;
          },
          set currentApproval(value) {
            currentApproval = value;
          },
        });
        if (result === 'boundary') sawStructuredBoundary = true;
      } else if (line && !looksLikeStartupNoise(line)) {
        handlers.onAssistantText?.(sessionId, line + '\n');
        if (looksCompleteBoundary(line)) {
          handlers.onAssistantBoundary?.(sessionId);
          sawStructuredBoundary = true;
        }
      }
    }

    if (sawStructuredBoundary) return { kind: 'assistant-boundary', text };
    return { kind: 'assistant-text', text };
  }

  function resolveApproval(approvalId, approved) {
    if (currentApproval?.id === approvalId) {
      currentApproval = { ...currentApproval, status: approved ? 'approved' : 'denied' };
      handlers.onApprovalResolved?.(currentApproval);
      return currentApproval;
    }
    return null;
  }

  return {
    parseChunk,
    resolveApproval,
  };
}

function handleStructuredEvent(sessionId, payload, handlers, approvalState) {
  if (payload.sessionID) {
    handlers.onRuntimeSession?.(sessionId, payload.sessionID);
  }

  // Detect agent name from structured events
  const agent = payload.agent || payload.part?.agent || payload.item?.agent || null;
  if (agent) {
    handlers.onAgentDetected?.(sessionId, agent);
  }

  if (payload.type === 'tool_use' && payload.part?.tool) {
    handlers.onToolUse?.(sessionId, {
      tool: payload.part.tool,
      callID: payload.part.callID,
      state: payload.part.state,
      input: payload.part.input || null,
      output: payload.part.output || null,
    });
    return 'tool';
  }

  if (payload.type === 'text' && payload.part?.text) {
    const extracted = extractThinkingAndText(payload.part.text);
    if (extracted.thinking) {
      handlers.onThinking?.(sessionId, extracted.thinking);
    }
    if (extracted.text) {
      handlers.onAssistantText?.(sessionId, extracted.text);
      if (looksLikeApproval(extracted.text)) {
        approvalState.currentApproval = {
          id: `approval_${Date.now()}`,
          sessionId,
          title: 'Runtime approval requested',
          detail: extracted.text,
          createdAt: now(),
          risk: classifyRisk(extracted.text),
          status: 'pending',
        };
        handlers.onApprovalRequested?.(approvalState.currentApproval);
      }
    }
    return 'text';
  }

  if (payload.type === 'step_finish') {
    handlers.onAssistantBoundary?.(sessionId);
    return 'boundary';
  }

  if (payload.type === 'item.completed' && payload.item?.type === 'agent_message' && payload.item?.text) {
    const extracted = extractThinkingAndText(payload.item.text);
    if (extracted.thinking) {
      handlers.onThinking?.(sessionId, extracted.thinking);
    }
    if (extracted.text) {
      handlers.onAssistantText?.(sessionId, extracted.text);
    }
    handlers.onAssistantBoundary?.(sessionId);
    return 'boundary';
  }

  if (payload.type === 'turn.completed') {
    handlers.onAssistantBoundary?.(sessionId);
    return 'boundary';
  }

  return 'ignore';
}

function extractThinkingAndText(text) {
  const thinkMatches = [];
  const cleaned = String(text).replace(/<think>([\s\S]*?)<\/think>\s*/g, (_, content) => {
    thinkMatches.push(content.trim());
    return '';
  });
  return {
    text: cleaned.trim(),
    thinking: thinkMatches.length ? thinkMatches.join('\n') : null,
  };
}

function sanitizeAssistantText(text) {
  return extractThinkingAndText(text).text;
}

function tryParseJson(line) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

function looksLikeApproval(text) {
  const normalized = String(text).toLowerCase();
  const positivePatterns = [
    /would you like me to run any further commands\?/i,
    /do you approve running any further commands\?/i,
    /please confirm before i run any additional commands\.?/i,
    /please approve before i run any further commands\.?/i,
  ];
  const negativePatterns = [
    /^approved_by_user\s*$/i,
    /^approval complete\s*$/i,
    /^confirmed\s*$/i,
  ];
  if (negativePatterns.some((pattern) => pattern.test(normalized.trim()))) {
    return false;
  }
  return positivePatterns.some((pattern) => pattern.test(normalized));
}

function looksCompleteBoundary(text) {
  // Only match actual OpenCode completion signals, not startup noise like 'Done! Checked 12 packages'
  if (looksLikeStartupNoise(text)) return false;
  return /^(done|completed|finished)\.?$/i.test(text.trim());
}

function classifyRisk(text) {
  if (/rm\s|sudo|delete|overwrite|install/i.test(text)) return 'high';
  if (/bash|command|write|edit|apply/i.test(text)) return 'medium';
  return 'low';
}

function looksLikeStartupNoise(text) {
  const t = String(text).trim();
  if (!t) return true;
  return /^\[config-context\]/i.test(t)
    || /^bun\s+(install|add|remove)/i.test(t)
    || /^Done!\s+Checked/i.test(t)
    || /^(npm|yarn|pnpm)\s+(WARN|notice|info)/i.test(t)
    || /^Resolving\s+dependencies/i.test(t)
    || /^\s*\d+\s+packages?\s/i.test(t)
    || /^defaulting to CLI paths/i.test(t);
}
