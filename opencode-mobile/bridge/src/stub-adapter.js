function now() {
  return new Date().toISOString();
}

export class InMemoryOpenCodeAdapter {
  constructor() {
    this.sessions = new Map();
    this.cancelled = new Set();
    this.approvals = new Map();
    this.seed();
  }

  seed() {
    const id = 'sess_demo';
    this.sessions.set(id, {
      session: {
        id,
        title: 'Demo session',
        workspace: '/workspace/demo',
        updatedAt: now(),
        status: 'idle',
        lastMessagePreview: 'Try asking for a refactor from your phone.',
        transport: 'stub',
      },
      messages: [
        {
          id: 'msg_welcome',
          role: 'assistant',
          text: 'Bridge stub is online. You can create sessions, send prompts, and test restore flow now.',
          createdAt: now(),
        },
      ],
    });

    this.approvals.set('approval_demo_1', {
      id: 'approval_demo_1',
      sessionId: id,
      title: 'Run shell command',
      detail: 'Plan mode wants permission to run a workspace command before changing files.',
      createdAt: now(),
      risk: 'medium',
      status: 'pending',
    });
  }

  listSessions() {
    return [...this.sessions.values()].map((entry) => entry.session).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  createSession(workspace) {
    const id = `sess_${Date.now()}`;
    const session = {
      id,
      title: `Session ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      workspace,
      updatedAt: now(),
      status: 'idle',
      lastMessagePreview: '',
      transport: 'stub',
    };
    this.sessions.set(id, { session, messages: [] });
    return session;
  }

  requireSession(sessionId) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    return entry.session;
  }

  getMessages(sessionId) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    return entry.messages;
  }

  listApprovals(sessionId) {
    return [...this.approvals.values()].filter((item) => item.sessionId === sessionId && item.status === 'pending');
  }

  respondToApproval(approvalId, approved) {
    const approval = this.approvals.get(approvalId);
    if (!approval) throw new Error(`Unknown approval: ${approvalId}`);
    approval.status = approved ? 'approved' : 'denied';
    return approval;
  }

  pushUserMessage(sessionId, text, handlers = {}) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    entry.messages.push({ id: `msg_user_${Date.now()}`, role: 'user', text, createdAt: now() });
    entry.session.updatedAt = now();
    entry.session.status = 'running';
    entry.session.lastMessagePreview = text;
    handlers.onSessionUpdated?.(entry.session);

    if (/approve|permission|bash|command/i.test(text)) {
      const approval = {
        id: `approval_${Date.now()}`,
        sessionId,
        title: 'Approve runtime action',
        detail: `OpenCode wants approval before proceeding: ${text}`,
        createdAt: now(),
        risk: 'medium',
        status: 'pending',
      };
      this.approvals.set(approval.id, approval);
      handlers.onApprovalRequested?.(approval);
    }

    const reply = this.startAssistantReply(sessionId, `Stub bridge reply for: ${text}\n\nNext step: replace stub mode with real OpenCode process mode.`);
    const parts = reply.text.split(/(\s+)/).filter(Boolean);
    let index = 0;
    const timer = setInterval(() => {
      if (this.isCancelled(sessionId)) {
        clearInterval(timer);
        this.clearCancel(sessionId);
        return;
      }
      const chunk = parts[index++];
      if (!chunk) {
        clearInterval(timer);
        this.completeAssistantReply(sessionId, reply.id);
        handlers.onMessageDone?.(sessionId, reply.id);
        handlers.onSessionUpdated?.(this.requireSession(sessionId));
        return;
      }
      this.appendAssistantDelta(sessionId, reply.id, chunk);
      handlers.onMessageDelta?.(sessionId, reply.id, chunk);
    }, 80);
  }

  startAssistantReply(sessionId, fullText) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    const msg = { id: `msg_assistant_${Date.now()}`, role: 'assistant', text: '', createdAt: now(), pending: true };
    entry.messages.push(msg);
    entry.session.updatedAt = now();
    entry.session.status = 'running';
    return { id: msg.id, text: fullText };
  }

  appendAssistantDelta(sessionId, messageId, chunk) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    const message = entry.messages.find((item) => item.id === messageId);
    if (!message) throw new Error(`Unknown message: ${messageId}`);
    message.text += chunk;
    entry.session.updatedAt = now();
  }

  completeAssistantReply(sessionId, messageId) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    const message = entry.messages.find((item) => item.id === messageId);
    if (message) message.pending = false;
    entry.session.status = 'idle';
    entry.session.updatedAt = now();
    entry.session.lastMessagePreview = message?.text.slice(0, 120) || entry.session.lastMessagePreview;
  }

  cancel(sessionId) {
    this.cancelled.add(sessionId);
    const entry = this.sessions.get(sessionId);
    if (entry) {
      entry.session.status = 'idle';
      entry.session.updatedAt = now();
    }
  }

  isCancelled(sessionId) {
    return this.cancelled.has(sessionId);
  }

  clearCancel(sessionId) {
    this.cancelled.delete(sessionId);
  }
}
