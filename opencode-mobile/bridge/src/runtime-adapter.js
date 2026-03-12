import { spawn } from 'node:child_process';
import { SessionStore } from './session-store.js';
import { createRuntimeParser } from './runtime-parser.js';

function now() {
  return new Date().toISOString();
}

function splitCommand(command) {
  if (!command.trim()) return [];
  return command.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) ?? [];
}

export class ProcessBackedOpenCodeAdapter {
  constructor(options = {}) {
    this.options = {
      command: options.command || process.env.OPENCODE_CMD || 'opencode',
      args: options.args || splitCommand(process.env.OPENCODE_ARGS || 'run --format json'),
      sessionArgs: options.sessionArgs || splitCommand(process.env.OPENCODE_SESSION_ARGS || ''),
    };
    this.store = new SessionStore();
    this.sessions = new Map();
    this.approvals = new Map();
    this.#hydrate();
  }

  #hydrate() {
    const saved = this.store.load();
    for (const savedEntry of saved) {
      const session = savedEntry?.session ?? savedEntry;
      const messages = Array.isArray(savedEntry?.messages) ? savedEntry.messages : [];
      if (!session?.id) continue;
      this.sessions.set(session.id, {
        session: { ...session, status: 'idle', transport: 'process' },
        messages,
        parser: null,
        currentAssistantId: null,
        proc: null,
        cancelRequested: false,
      });
    }
  }

  #persist() {
    this.store.save([...this.sessions.values()].map((entry) => ({ session: entry.session, messages: entry.messages })));
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
      transport: 'process',
      runtimeSessionID: null,
      lastTool: null,
      consentState: null,
    };
    this.sessions.set(id, { session, messages: [], parser: null, currentAssistantId: null, proc: null, cancelRequested: false });
    this.#persist();
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

  respondToApproval(approvalId, approved, handlers = {}) {
    const approval = this.approvals.get(approvalId);
    if (!approval) throw new Error(`Unknown approval: ${approvalId}`);
    approval.status = approved ? 'approved' : 'denied';
    const entry = this.sessions.get(approval.sessionId);
    if (entry) {
      entry.session.consentState = {
        approved,
        approvalId,
        detail: approval.detail,
        updatedAt: now(),
      };
      entry.session.updatedAt = now();
      this.#persist();
      handlers.onSessionUpdated?.(entry.session);
    }
    entry?.parser?.resolveApproval?.(approvalId, approved);
    handlers.onApprovalResolved?.(approval);
    return approval;
  }

  pushUserMessage(sessionId, text, handlers = {}) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);

    entry.parser = createRuntimeParser({
      onApprovalRequested: (approval) => {
        this.approvals.set(approval.id, approval);
        handlers.onApprovalRequested?.(approval);
      },
      onApprovalResolved: (approval) => {
        this.approvals.set(approval.id, approval);
        handlers.onApprovalResolved?.(approval);
      },
      onTaskError: (sid, message) => handlers.onTaskError?.(sid, message),
      onAssistantText: (sid, chunk) => this.#appendAssistantText(sid, chunk, handlers),
      onAssistantBoundary: (sid) => this.#completeAssistantBoundary(sid, handlers),
      onRuntimeSession: (sid, runtimeSessionID) => this.#setRuntimeSessionID(sid, runtimeSessionID, handlers),
      onToolUse: (sid, toolUse) => this.#recordToolUse(sid, toolUse, handlers),
    });

    entry.cancelRequested = false;
    const effectiveText = this.#applyConsentContext(entry, text);
    entry.messages.push({ id: `msg_user_${Date.now()}`, role: 'user', text: effectiveText, createdAt: now() });
    entry.session.updatedAt = now();
    entry.session.status = 'running';
    entry.session.lastMessagePreview = effectiveText;
    this.#persist();
    handlers.onSessionUpdated?.(entry.session);

    const assistantId = `msg_assistant_${Date.now()}`;
    entry.currentAssistantId = assistantId;
    entry.messages.push({ id: assistantId, role: 'assistant', text: '', createdAt: now(), pending: true });

    const argv = this.#buildCommandArgs(entry, effectiveText);
    let proc;
    try {
      proc = spawn(this.options.command, argv, {
        cwd: entry.session.workspace,
        env: process.env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: true,
      });
    } catch (error) {
      entry.session.status = 'error';
      entry.session.updatedAt = now();
      this.#persist();
      handlers.onSessionUpdated?.(entry.session);
      handlers.onTaskError?.(entry.session.id, `Failed to start runtime process: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }

    entry.proc = proc;

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stdout.on('data', (chunk) => entry.parser?.parseChunk(entry.session.id, 'stdout', String(chunk)));
    proc.stderr.on('data', (chunk) => entry.parser?.parseChunk(entry.session.id, 'stderr', String(chunk)));
    proc.once('error', (error) => {
      entry.session.status = 'error';
      entry.session.updatedAt = now();
      this.#persist();
      handlers.onSessionUpdated?.(entry.session);
      handlers.onTaskError?.(entry.session.id, `Runtime process error: ${error.message}`);
    });
    proc.on('exit', (code, signal) => {
      entry.proc = null;
      const cancelled = entry.cancelRequested && (signal === 'SIGTERM' || signal === 'SIGINT');
      entry.session.status = cancelled || code === 0 || signal === 'SIGINT' ? 'idle' : 'error';
      entry.session.updatedAt = now();
      this.#persist();
      handlers.onSessionUpdated?.(entry.session);
      if (cancelled) {
        entry.cancelRequested = false;
        return;
      }
      if (code !== 0 && signal !== 'SIGINT') {
        handlers.onTaskError?.(entry.session.id, `Runtime exited with code ${code ?? 'unknown'} signal ${signal ?? 'none'}`);
      }
    });

    return assistantId;
  }

  cancel(sessionId) {
    const entry = this.sessions.get(sessionId);
    if (!entry) throw new Error(`Unknown session: ${sessionId}`);
    if (entry.proc && !entry.proc.killed) {
      entry.cancelRequested = true;
      try {
        process.kill(-entry.proc.pid, 'SIGTERM');
      } catch {
        try {
          entry.proc.kill('SIGTERM');
        } catch {}
      }
    }
    if (entry.currentAssistantId) {
      const msg = entry.messages.find((item) => item.id === entry.currentAssistantId);
      if (msg) msg.pending = false;
      entry.currentAssistantId = null;
    }
    entry.session.status = 'idle';
    entry.session.updatedAt = now();
    this.#persist();
  }

  #applyConsentContext(entry, text) {
    const consent = entry.session.consentState;
    if (!consent) return text;
    entry.session.consentState = null;
    if (consent.approved) {
      return `The user approved the previously requested next command. Continue accordingly.\n\nUser request: ${text}`;
    }
    return `The user denied the previously requested next command. Do not execute that pending next step unless explicitly re-approved.\n\nUser request: ${text}`;
  }

  #buildCommandArgs(entry, text) {
    const args = [...this.options.args, ...this.options.sessionArgs];
    const attachUrl = process.env.OPENCODE_ATTACH_URL;
    if (attachUrl) {
      args.push('--attach', attachUrl);
    }
    if (entry.session.runtimeSessionID) {
      args.push('--session', entry.session.runtimeSessionID);
    } else if (process.env.OPENCODE_CONTINUE_LAST === '1') {
      args.push('--continue');
    }
    if (entry.session.workspace) {
      args.push('--dir', entry.session.workspace);
    }
    args.push(text);
    return args;
  }

  #setRuntimeSessionID(sessionId, runtimeSessionID, handlers) {
    const entry = this.sessions.get(sessionId);
    if (!entry) return;
    if (entry.session.runtimeSessionID !== runtimeSessionID) {
      entry.session.runtimeSessionID = runtimeSessionID;
      entry.session.updatedAt = now();
      this.#persist();
      handlers.onSessionUpdated?.(entry.session);
    }
  }

  #recordToolUse(sessionId, toolUse, handlers) {
    const entry = this.sessions.get(sessionId);
    if (!entry) return;
    entry.session.lastTool = toolUse.tool || null;
    entry.session.updatedAt = now();
    this.#persist();
    handlers.onTaskStatus?.(sessionId, {
      status: 'tool-use',
      tool: toolUse.tool,
      callID: toolUse.callID,
      state: toolUse.state,
    });
    handlers.onSessionUpdated?.(entry.session);
  }

  #appendAssistantText(sessionId, text, handlers) {
    const entry = this.sessions.get(sessionId);
    if (!entry) return;
    if (!entry.currentAssistantId) {
      const assistantId = `msg_assistant_${Date.now()}`;
      entry.currentAssistantId = assistantId;
      entry.messages.push({ id: assistantId, role: 'assistant', text: '', createdAt: now(), pending: true });
    }
    const message = entry.messages.find((item) => item.id === entry.currentAssistantId);
    if (!message) return;
    message.text += text;
    entry.session.updatedAt = now();
    handlers.onMessageDelta?.(sessionId, entry.currentAssistantId, text);
  }

  #completeAssistantBoundary(sessionId, handlers) {
    const entry = this.sessions.get(sessionId);
    if (!entry || !entry.currentAssistantId) return;
    const message = entry.messages.find((item) => item.id === entry.currentAssistantId);
    if (message) message.pending = false;
    handlers.onMessageDone?.(sessionId, entry.currentAssistantId);
    entry.session.status = 'idle';
    entry.session.lastMessagePreview = message?.text.slice(0, 120) || entry.session.lastMessagePreview;
    entry.session.updatedAt = now();
    this.#persist();
    handlers.onSessionUpdated?.(entry.session);
    entry.currentAssistantId = null;
  }
}
