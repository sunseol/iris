import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ApprovalRequest, AuthProfile, ChatMessage, ModelConfig, Project, ProjectSession, TaskStatusEvent } from '../types';
import { TopStatusBar } from '../components/TopStatusBar';
import { ThreadRail } from '../components/ThreadRail';
import { TranscriptPane } from '../components/TranscriptPane';
import { ComposerBar } from '../components/ComposerBar';
import { tokens } from '../theme/tokens';
import { DiffReviewSheet } from '../components/DiffReviewSheet';

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
  onOpenSettings,
  onResolveApproval,
  activeAgent,
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
  activeAgent?: string | null;
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
  onOpenSettings: () => void;
  onResolveApproval: (approvalId: string, approved: boolean) => void;
}) {
  const [railOpen, setRailOpen] = useState(false);
  const [diffSheetOpen, setDiffSheetOpen] = useState(false);
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
        activeAgent={activeAgent}
        onOpenProjects={onOpenProjects}
        onOpenSettings={onOpenSettings}
      />

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

      <ScrollView
        style={styles.main}
        contentContainerStyle={[styles.mainContent, { paddingBottom: compact ? 220 : 180, minHeight: height * 0.72 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Approval cards - Irisfront amber box style */}
        {!!approvals.length && approvals.map((approval) => (
          <View key={approval.id} style={styles.approvalCard}>
            <View style={styles.approvalHeader}>
              <View style={styles.approvalDot} />
              <Text style={styles.approvalTitle}>{approval.title}</Text>
            </View>
            <Text style={styles.approvalDetail}>{approval.detail}</Text>
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => onResolveApproval(approval.id, true)}
                activeOpacity={0.7}
              >
                <Ionicons name="checkmark" size={16} color="#78350f" />
                <Text style={styles.approveText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.denyButton}
                onPress={() => onResolveApproval(approval.id, false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={16} color="#92400e" />
                <Text style={styles.denyText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Task status - inline in workspace like Irisfront */}
        {taskStatus && (activeSession?.status === 'running' || activeSession?.status === 'error' || activeSession?.status === 'cancelled') && (
          <View style={styles.taskStatusCard}>
            {activeSession?.status === 'running' && (
              <View style={styles.taskStatusRunning}>
                <Ionicons name="sync-outline" size={18} color="#2563eb" />
                <Text style={styles.taskStatusRunningText}>{taskStatus.state?.title || 'Working...'}</Text>
              </View>
            )}
            {activeSession?.status === 'error' && (
              <View style={styles.taskStatusError}>
                <View style={styles.taskStatusErrorIcon}>
                  <Ionicons name="warning-outline" size={14} color="#dc2626" />
                </View>
                <Text style={styles.taskStatusErrorText}>{taskStatus.state?.title || error || 'Task failed'}</Text>
              </View>
            )}
            {activeSession?.status === 'cancelled' && (
              <View style={styles.taskStatusCancelled}>
                <View style={styles.taskStatusCancelledIcon}>
                  <Ionicons name="close" size={14} color="#6b7280" />
                </View>
                <Text style={styles.taskStatusCancelledText}>Task cancelled by user</Text>
              </View>
            )}
          </View>
        )}

        {changedFilesCount > 0 && (
          <TouchableOpacity style={styles.fileListCard} onPress={() => setDiffSheetOpen(true)} activeOpacity={0.7}>
            <View style={styles.fileListTrigger}>
              <View style={styles.fileIconWrap}>
                <Ionicons name="code-slash-outline" size={16} color={tokens.color.textMuted} />
              </View>
              <View style={styles.fileListCopy}>
                <Text style={styles.fileListTitle}>{changedFilesCount} changed file{changedFilesCount === 1 ? '' : 's'}</Text>
                <Text style={styles.fileListMeta} numberOfLines={1}>{diffPreview}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} />
            </View>
          </TouchableOpacity>
        )}

        {/* Transcript - Irisfront workspace messages */}
        {hasSessions ? (
          <TranscriptPane messages={messages} loading={connectionMode === 'connecting'} />
        ) : (
          <TranscriptPane messages={[]} loading={false} />
        )}
      </ScrollView>

      <ComposerBar
        value={draft}
        onChangeText={onDraftChange}
        onSend={onSend}
        onCancel={onCancelTask}
        onResume={() => setRailOpen(true)}
        modelLabel={activeModel?.label || 'Unassigned'}
        disabled={connectionMode === 'disconnected'}
      />

      <DiffReviewSheet
        open={diffSheetOpen}
        onClose={() => setDiffSheetOpen(false)}
        files={changedFilesCount > 0 ? [{
          path: activeSession?.workspacePath ? `${activeSession.workspacePath}/changes.patch` : 'changes.patch',
          additions: Math.max(1, changedFilesCount * 3),
          deletions: Math.max(0, changedFilesCount),
          preview: diffPreview,
          status: 'pending' as const,
        }] : []}
        onApply={() => onResolveApproval(approvals[0]?.id || 'diff_apply', true)}
        onReject={() => onResolveApproval(approvals[0]?.id || 'diff_reject', false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  main: { flex: 1 },
  mainContent: { gap: 20, paddingHorizontal: 16, paddingTop: 16 },

  // Approval card - Irisfront amber style
  approvalCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approvalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  approvalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },
  approvalDetail: {
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 10,
    borderRadius: 12,
  },
  approveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#78350f',
  },
  denyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingVertical: 10,
    borderRadius: 12,
  },
  denyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
  },

  // Task status cards - Irisfront state bars
  taskStatusCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  taskStatusRunning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  taskStatusRunningText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e40af',
  },
  taskStatusError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  taskStatusErrorIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskStatusErrorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#991b1b',
    flex: 1,
  },
  taskStatusCancelled: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  taskStatusCancelledIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskStatusCancelledText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },

  fileListCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    padding: 14,
  },
  fileListTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileListCopy: {
    flex: 1,
    gap: 2,
  },
  fileListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.color.text,
  },
  fileListMeta: {
    fontSize: 12,
    color: tokens.color.textMuted,
  },
});
