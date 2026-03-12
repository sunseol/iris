import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { ApprovalRequest, AuthProfile, ChatMessage, ModelConfig, Project, ProjectSession, TaskStatusEvent } from '../types';
import { TopStatusBar } from '../components/TopStatusBar';
import { ThreadRail } from '../components/ThreadRail';
import { RuntimeStateCard } from '../components/RuntimeStateCard';
import { TranscriptPane } from '../components/TranscriptPane';
import { ComposerBar } from '../components/ComposerBar';
import { DiffReviewCard } from '../components/DiffReviewCard';
import { GhostButton, SecondaryButton, SectionCard } from '../components';
import { tokens } from '../theme/tokens';

export function ProjectWorkspaceScreen({
  project,
  activeSession,
  sessions,
  sessionMeta,
  approvalsBySessionId,
  messages,
  approvals,
  taskStatus,
  connectionMode,
  authProfile,
  activeModel,
  error,
  draft,
  activityExpanded,
  onToggleActivity,
  onDraftChange,
  onSend,
  onCancelTask,
  onCreateSession,
  onSelectSession,
  onOpenProjects,
  onOpenModelsAuth,
  onOpenConnection,
  onResolveApproval,
}: {
  project: Project | null;
  activeSession: ProjectSession | null;
  sessions: ProjectSession[];
  sessionMeta: Record<string, { messageCount: number; turnCount: number; lastActivityLabel: string; changedFilesCount: number }>;
  approvalsBySessionId: Record<string, number>;
  messages: ChatMessage[];
  approvals: ApprovalRequest[];
  taskStatus: TaskStatusEvent | null;
  connectionMode: 'disconnected' | 'connecting' | 'connected';
  authProfile: AuthProfile | null;
  activeModel: ModelConfig | null;
  error?: string | null;
  draft: string;
  activityExpanded: boolean;
  onToggleActivity: () => void;
  onDraftChange: (text: string) => void;
  onSend: () => void;
  onCancelTask: () => void;
  onCreateSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onOpenProjects: () => void;
  onOpenModelsAuth: () => void;
  onOpenConnection: () => void;
  onResolveApproval: (approvalId: string, approved: boolean) => void;
}) {
  const [railOpen, setRailOpen] = useState(false);
  const { width, height } = useWindowDimensions();
  const compact = width < 420;
  const hasSessions = sessions.length > 0;
  const changedFilesCount = activeSession ? sessionMeta[activeSession.id]?.changedFilesCount || 0 : 0;
  const diffPreview = activeSession?.lastMessagePreview || taskStatus?.state?.output || 'No changed files yet.';
  const railState = connectionMode === 'connecting' ? 'loading' : connectionMode === 'disconnected' ? 'disconnected' : 'ready';

  return (
    <View style={styles.container}>
      <TopStatusBar
        projectName={project?.name || 'No project'}
        workspacePath={project?.workspacePath || 'No workspace configured'}
        executionTarget={(project as Project & { executionTarget?: string } | null)?.executionTarget || 'local'}
        model={activeModel?.label || 'Unassigned'}
        authState={authProfile ? `${authProfile.label} (${authProfile.status})` : 'not configured'}
        connectionState={connectionMode}
        threadStatus={activeSession?.status || 'idle'}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow} style={styles.actionsScroller}>
        <GhostButton title={hasSessions ? `${sessions.length}` : ''} icon="albums-outline" onPress={() => setRailOpen(true)} active={railOpen} />
        <GhostButton title="Projects" icon="folder-open-outline" onPress={onOpenProjects} />
        <GhostButton title="Model" icon="sparkles-outline" onPress={onOpenModelsAuth} />
        <GhostButton title="Conn" icon="git-network-outline" onPress={onOpenConnection} />
        <GhostButton title={activityExpanded ? 'Hide' : 'Show'} icon={activityExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} onPress={onToggleActivity} active={activityExpanded} />
      </ScrollView>

      <SectionCard>
        <View style={[styles.activeThreadBar, compact && styles.activeThreadBarCompact]}>
          <View style={styles.activeThreadCopy}>
            <Text style={styles.activeThreadLabel}>Active thread</Text>
            <Text style={styles.activeThreadTitle}>{activeSession?.title || 'No active thread'}</Text>
            <Text style={styles.activeThreadMeta} numberOfLines={1}>
              {activeSession?.lastMessagePreview || activeSession?.workspacePath || 'Open the thread navigator to switch or create a thread.'}
            </Text>
            <Text style={styles.testingHelp}>테스트 기본 흐름: Connect → thread 생성/선택 → Send command → 응답 확인 → 필요 시 Resume/Cancel. approval required 흐름은 현재 환경에 따라 완전 검증이 제한될 수 있습니다.</Text>
          </View>
          <View style={styles.activeThreadPills}>
            <Text style={styles.threadPill}>{activeSession?.status || 'idle'}</Text>
            <Text style={styles.threadPillMono}>{sessionMeta[activeSession?.id || '']?.changedFilesCount || 0} files</Text>
          </View>
        </View>
      </SectionCard>

      <ThreadRail
        open={railOpen}
        onClose={() => setRailOpen(false)}
        projectName={project?.name}
        workspacePath={project?.workspacePath}
        modelLabel={activeModel?.label || 'Unassigned'}
        connectionState={connectionMode}
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        sessionMeta={sessionMeta}
        approvalsBySessionId={approvalsBySessionId}
        state={railState}
        onSelectSession={onSelectSession}
        onCreateSession={onCreateSession}
        onCancelThread={(sessionId) => {
          if (activeSession?.id === sessionId) {
            onCancelTask();
            return;
          }
          onSelectSession(sessionId);
          setRailOpen(false);
          setTimeout(() => onCancelTask(), 0);
        }}
      />

      <ScrollView style={styles.main} contentContainerStyle={[styles.mainContent, { paddingBottom: compact ? 220 : 180, minHeight: height * 0.72 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <RuntimeStateCard
          connectionStatus={connectionMode}
          sessionStatus={activeSession?.status}
          taskStatus={taskStatus}
          error={error}
          expanded={activityExpanded}
          onToggle={onToggleActivity}
          executionTarget={(project as Project & { executionTarget?: string } | null)?.executionTarget || 'local'}
        />

        {!!approvals.length && (
          <SectionCard>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Approval action bar</Text>
              <Text style={styles.waitBadge}>waiting approval</Text>
            </View>
            <Text style={styles.sectionBody}>Runtime is paused until you approve or deny the requested action.</Text>
            {approvals.map((approval) => (
              <View key={approval.id} style={styles.approvalCard}>
                <Text style={styles.approvalTitle}>{approval.title}</Text>
                <Text style={styles.approvalText}>{approval.detail}</Text>
                <View style={styles.approvalActions}>
                  <SecondaryButton title="Deny" onPress={() => onResolveApproval(approval.id, false)} danger />
                  <SecondaryButton title="Approve" onPress={() => onResolveApproval(approval.id, true)} />
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task timeline / execution log</Text>
            <Text style={styles.metaMono}>{taskStatus?.status || activeSession?.status || 'idle'}</Text>
          </View>
          {taskStatus ? (
            <View style={styles.timelineStack}>
              {!!taskStatus.state?.title && <Text style={styles.timelineTitle}>{taskStatus.state.title}</Text>}
              <Text style={styles.timelineLine}>status: {taskStatus.status}</Text>
              {!!taskStatus.tool && <Text style={styles.timelineLine}>tool: {taskStatus.tool}</Text>}
              {!!taskStatus.state?.output && <Text style={styles.logBlock}>{taskStatus.state.output.trim()}</Text>}
            </View>
          ) : (
            <Text style={styles.emptyCopy}>No runtime log yet. Start or resume a thread to populate execution activity.</Text>
          )}
        </SectionCard>

        {hasSessions ? (
          <TranscriptPane messages={messages} loading={connectionMode === 'connecting'} />
        ) : (
          <SectionCard>
            <Text style={styles.sectionTitle}>Empty project</Text>
            <Text style={styles.emptyCopy}>This project has no threads yet. Create a new thread to start the first isolated task run.</Text>
            <View style={styles.inlineAction}><SecondaryButton title="Create first thread" onPress={onCreateSession} /></View>
          </SectionCard>
        )}

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Diff review</Text>
            <Text style={styles.metaMono}>{changedFilesCount} file{changedFilesCount === 1 ? '' : 's'}</Text>
          </View>
          {changedFilesCount > 0 ? (
            <DiffReviewCard
              path={activeSession?.workspacePath ? `${activeSession.workspacePath}/changes.patch` : 'changes.patch'}
              additions={Math.max(1, changedFilesCount * 3)}
              deletions={Math.max(0, changedFilesCount)}
              preview={diffPreview}
              status="pending"
              onApply={() => onResolveApproval(approvals[0]?.id || 'diff_apply', true)}
              onReject={() => onResolveApproval(approvals[0]?.id || 'diff_reject', false)}
            />
          ) : (
            <Text style={styles.emptyCopy}>No changed files yet. Structured diff review cards will appear here when the active thread produces edits.</Text>
          )}
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Context attachments</Text>
            <Text style={styles.metaMono}>0 attached</Text>
          </View>
          <Text style={styles.emptyCopy}>No context attached. Add files, notes, or artifacts to guide this thread later.</Text>
        </SectionCard>
      </ScrollView>

      <View style={styles.composerDock}>
      <ComposerBar
        value={draft}
        onChangeText={onDraftChange}
        onSend={onSend}
        onCancel={onCancelTask}
        onResume={() => activeSession?.id && onSelectSession(activeSession.id)}
        modelLabel={activeModel?.label || 'Unassigned'}
        disabled={!activeSession || !draft.trim()}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 10 },
  actionsScroller: { flexGrow: 0 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  activeThreadBar: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' },
  activeThreadBarCompact: { flexDirection: 'column', alignItems: 'flex-start' },
  activeThreadCopy: { flex: 1, paddingRight: 8 },
  activeThreadLabel: { color: tokens.color.textMuted, fontSize: 10, textTransform: 'uppercase', fontWeight: '700' },
  activeThreadTitle: { color: tokens.color.text, fontWeight: '700', fontSize: 15, marginTop: 4 },
  activeThreadMeta: { color: tokens.color.textMuted, marginTop: 4, fontSize: 12, lineHeight: 18 },
  testingHelp: { color: tokens.color.textMuted, marginTop: 8, fontSize: 12, lineHeight: 18 },
  activeThreadPills: { alignItems: 'flex-end', gap: 6 },
  composerDock: { paddingTop: 2 },
  threadPill: { color: tokens.color.text, backgroundColor: tokens.color.primarySoft, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontWeight: '700' },
  threadPillMono: { color: tokens.color.mono, backgroundColor: tokens.color.chip, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontFamily: tokens.type.mono },
  main: { flex: 1 },
  mainContent: { gap: 10, paddingBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { color: tokens.color.text, fontWeight: '700', fontSize: 15 },
  waitBadge: { color: '#fde68a', backgroundColor: '#33240f', borderWidth: 1, borderColor: '#a16207', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontWeight: '700' },
  metaMono: { color: tokens.color.mono, fontFamily: tokens.type.mono, fontSize: 12 },
  sectionBody: { color: tokens.color.textSoft, lineHeight: 18 },
  approvalCard: { backgroundColor: tokens.color.panelAlt, borderWidth: 1, borderColor: '#5b3a00', borderRadius: 12, padding: 12, marginTop: 8 },
  approvalTitle: { color: '#fde68a', fontWeight: '700' },
  approvalText: { color: '#fef3c7', marginTop: 6, lineHeight: 18 },
  approvalActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  timelineStack: { gap: 6 },
  timelineTitle: { color: tokens.color.text, fontWeight: '700' },
  timelineLine: { color: tokens.color.textSoft, fontFamily: tokens.type.mono },
  logBlock: { color: tokens.color.text, backgroundColor: tokens.color.panelMuted, borderWidth: 1, borderColor: tokens.color.border, borderRadius: 12, padding: 10, fontFamily: tokens.type.mono },
  emptyCopy: { color: tokens.color.textMuted, lineHeight: 19 },
  inlineAction: { marginTop: 12, alignSelf: 'flex-start' },
});
