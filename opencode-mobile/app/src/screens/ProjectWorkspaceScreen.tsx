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
        projectName={project?.name || '프로젝트 없음'}
        workspacePath={project?.workspacePath || '워크스페이스가 설정되지 않음'}
        executionTarget={(project as Project & { executionTarget?: string } | null)?.executionTarget || '로컬'}
        model={activeModel?.label || '미지정'}
        authState={authProfile ? `${authProfile.label} (${authProfile.status})` : '설정되지 않음'}
        connectionState={connectionMode}
        threadStatus={activeSession?.status || 'idle'}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow} style={styles.actionsScroller}>
        <GhostButton title={hasSessions ? `${sessions.length}` : ''} icon="albums-outline" onPress={() => setRailOpen(true)} active={railOpen} />
        <GhostButton title="프로젝트" icon="folder-open-outline" onPress={onOpenProjects} />
        <GhostButton title="모델" icon="sparkles-outline" onPress={onOpenModelsAuth} />
        <GhostButton title="연결" icon="git-network-outline" onPress={onOpenConnection} />
        <GhostButton title={activityExpanded ? '숨기기' : '보기'} icon={activityExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} onPress={onToggleActivity} active={activityExpanded} />
      </ScrollView>

      <SectionCard>
        <View style={[styles.activeThreadBar, compact && styles.activeThreadBarCompact]}>
          <View style={styles.activeThreadCopy}>
            <Text style={styles.activeThreadLabel}>현재 스레드</Text>
            <Text style={styles.activeThreadTitle}>{activeSession?.title || '활성 스레드 없음'}</Text>
            <Text style={styles.activeThreadMeta} numberOfLines={1}>
              {activeSession?.lastMessagePreview || activeSession?.workspacePath || '스레드 탐색기를 열어 스레드를 바꾸거나 새로 만드세요.'}
            </Text>
            <Text style={styles.testingHelp}>기본 흐름: OpenCode 브리지 연결 → 프로젝트 안에서 스레드 생성/선택 → 작업 보내기 → 런타임 응답 확인 → 필요 시 이어하기/취소. 승인 요청이 있으면 여기서 승인 또는 거부합니다.</Text>
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
        modelLabel={activeModel?.label || '미지정'}
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
              <Text style={styles.sectionTitle}>승인 작업</Text>
              <Text style={styles.waitBadge}>승인 대기</Text>
            </View>
            <Text style={styles.sectionBody}>승인하거나 거부할 때까지 런타임이 일시 정지됩니다.</Text>
            {approvals.map((approval) => (
              <View key={approval.id} style={styles.approvalCard}>
                <Text style={styles.approvalTitle}>{approval.title}</Text>
                <Text style={styles.approvalText}>{approval.detail}</Text>
                <View style={styles.approvalActions}>
                  <SecondaryButton title="거부" onPress={() => onResolveApproval(approval.id, false)} danger />
                  <SecondaryButton title="승인" onPress={() => onResolveApproval(approval.id, true)} />
                </View>
              </View>
            ))}
          </SectionCard>
        )}

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>작업 타임라인 / 실행 로그</Text>
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
            <Text style={styles.emptyCopy}>아직 런타임 로그가 없습니다. 스레드를 시작하거나 다시 이어서 실행 기록을 채우세요.</Text>
          )}
        </SectionCard>

        {hasSessions ? (
          <TranscriptPane messages={messages} loading={connectionMode === 'connecting'} />
        ) : (
          <SectionCard>
            <Text style={styles.sectionTitle}>빈 프로젝트</Text>
            <Text style={styles.emptyCopy}>이 프로젝트에는 아직 스레드가 없습니다. 새 스레드를 만들어 첫 작업을 시작하세요.</Text>
            <View style={styles.inlineAction}><SecondaryButton title="첫 스레드 만들기" onPress={onCreateSession} /></View>
          </SectionCard>
        )}

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>변경사항 검토</Text>
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
            <Text style={styles.emptyCopy}>아직 변경된 파일이 없습니다. 활성 스레드가 파일을 수정하면 여기에 검토 카드가 표시됩니다.</Text>
          )}
        </SectionCard>

        <SectionCard>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>컨텍스트 첨부</Text>
            <Text style={styles.metaMono}>0개 첨부됨</Text>
          </View>
          <Text style={styles.emptyCopy}>첨부된 컨텍스트가 없습니다. 나중에 파일, 메모, 산출물을 추가해 스레드를 더 잘 안내할 수 있습니다.</Text>
        </SectionCard>
      </ScrollView>

      <View style={styles.composerDock}>
      <ComposerBar
        value={draft}
        onChangeText={onDraftChange}
        onSend={onSend}
        onCancel={onCancelTask}
        onResume={() => activeSession?.id && onSelectSession(activeSession.id)}
        modelLabel={activeModel?.label || '미지정'}
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
