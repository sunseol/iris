import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProjectSession } from '../types';
import { tokens } from '../theme/tokens';
import { ThreadCard } from './ThreadCard';

type RailState = 'ready' | 'loading' | 'disconnected';
type FilterKey = 'all' | 'active' | 'running' | 'waiting' | 'errors' | 'cancelled' | 'idle';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '활성' },
  { key: 'running', label: '실행 중' },
  { key: 'waiting', label: '대기' },
  { key: 'errors', label: '오류' },
  { key: 'cancelled', label: '취소됨' },
  { key: 'idle', label: '유휴' },
];

function priorityFor(session: ProjectSession, activeSessionId: string | null) {
  if (session.status === 'waiting_approval') return 0;
  if (session.status === 'running') return 1;
  if (session.status === 'error') return 2;
  if (session.id === activeSessionId) return 3;
  if (session.status === 'disconnected') return 4;
  if (session.status === 'cancelled') return 5;
  return 6;
}

function matchesFilter(filter: FilterKey, session: ProjectSession, activeSessionId: string | null) {
  switch (filter) {
    case 'active': return session.id === activeSessionId;
    case 'running': return session.status === 'running';
    case 'waiting': return session.status === 'waiting_approval';
    case 'errors': return session.status === 'error' || !!session.lastError;
    case 'cancelled': return session.status === 'cancelled';
    case 'idle': return session.status === 'idle';
    default: return true;
  }
}

function emptyCopy(filter: FilterKey) {
  switch (filter) {
    case 'active': return '이 프로젝트에서 선택된 활성 스레드가 없습니다.';
    case 'running': return '이 프로젝트에서 실행 중인 스레드가 없습니다.';
    case 'waiting': return '이 프로젝트에서 승인 대기 중인 스레드가 없습니다.';
    case 'errors': return '이 프로젝트에서 오류 상태 스레드가 없습니다.';
    case 'cancelled': return '이 프로젝트에서 취소된 스레드가 없습니다.';
    case 'idle': return '이 프로젝트에서 유휴 상태 스레드가 없습니다.';
    default: return '이 프로젝트에는 아직 스레드가 없습니다. 새 작업을 시작해 첫 실행을 만들어 보세요.';
  }
}

export function ThreadRail({
  open,
  onClose,
  projectName,
  workspacePath,
  modelLabel,
  connectionState,
  sessions,
  activeSessionId,
  sessionMeta,
  approvalsBySessionId,
  state,
  onSelectSession,
  onCreateSession,
  onCancelThread,
}: {
  open: boolean;
  onClose: () => void;
  projectName?: string | null;
  workspacePath?: string | null;
  modelLabel?: string | null;
  connectionState: 'disconnected' | 'connecting' | 'connected';
  sessions: ProjectSession[];
  activeSessionId: string | null;
  sessionMeta: Record<string, { messageCount: number; turnCount: number; lastActivityLabel: string; changedFilesCount: number }>;
  approvalsBySessionId: Record<string, number>;
  state: RailState;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
  onCancelThread: (sessionId: string) => void;
}) {
  const [filter, setFilter] = useState<FilterKey>('all');
  const translateY = useRef(new Animated.Value(420)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: open ? 0 : 420,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
      mass: 0.9,
    }).start();
  }, [open, translateY]);

  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const pri = priorityFor(a, activeSessionId) - priorityFor(b, activeSessionId);
      if (pri !== 0) return pri;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [sessions, activeSessionId]);

  const filteredSessions = useMemo(
    () => sortedSessions.filter((session) => matchesFilter(filter, session, activeSessionId)),
    [sortedSessions, filter, activeSessionId],
  );

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8 && gesture.dy > 0,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 110 || gesture.vy > 1.1) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 180,
            mass: 0.9,
          }).start();
        }
      },
    }),
    [onClose, translateY],
  );

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>스레드 탐색기</Text>
              <Text style={styles.subtitle}>{projectName || '현재 프로젝트'} · 스레드 {sessions.length}개</Text>
              <Text style={styles.projectMeta} numberOfLines={1}>{workspacePath || '워크스페이스가 설정되지 않음'}</Text>
            </View>
            <View style={styles.headerActions}>
              <Text style={styles.compactMeta}>{modelLabel || '미지정'}</Text>
              <Text style={[styles.compactMeta, connectionState === 'disconnected' && styles.compactMetaWarn]}>{connectionState}</Text>
              <Text onPress={onCreateSession} style={styles.newButton}>+ 새 스레드</Text>
            </View>
          </View>

          <View style={styles.filterRow}>
            {FILTERS.map((item) => (
              <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filterChip, filter === item.key && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryText}>총 {sessions.length}개 중 {filteredSessions.length}개 표시</Text>
            <Text style={styles.summaryText}>필터: {filter}</Text>
          </View>

          {state === 'loading' ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>스레드 불러오는 중</Text>
              <Text style={styles.stateText}>프로젝트 범위의 스레드와 현재 활성 상태를 복원하는 중입니다...</Text>
            </View>
          ) : !sessions.length || !filteredSessions.length ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateTitle}>{!sessions.length ? '프로젝트에 스레드가 없음' : `${filter} 스레드 없음`}</Text>
              <Text style={styles.stateText}>{emptyCopy(filter)}</Text>
              {!sessions.length && <Text onPress={onCreateSession} style={styles.inlineAction}>첫 스레드 만들기</Text>}
            </View>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
              {state === 'disconnected' && (
                <View style={[styles.stateCard, styles.disconnectedCard]}>
                  <Text style={styles.stateTitle}>연결 끊김</Text>
                  <Text style={styles.stateText}>스레드 상태는 유지되지만, 연결이 복구될 때까지 런타임을 사용할 수 없습니다.</Text>
                </View>
              )}
              {filteredSessions.map((session) => {
                const meta = sessionMeta[session.id] || { messageCount: 0, turnCount: 0, lastActivityLabel: 'No activity yet', changedFilesCount: 0 };
                return (
                  <ThreadCard
                    key={session.id}
                    session={session}
                    active={session.id === activeSessionId}
                    onPress={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    onResume={() => {
                      onSelectSession(session.id);
                      onClose();
                    }}
                    onCancel={() => onCancelThread(session.id)}
                    summary={session.lastMessagePreview || meta.lastActivityLabel || 'No activity yet'}
                    changedFilesCount={meta.changedFilesCount}
                    approvalPending={(approvalsBySessionId[session.id] || 0) > 0 || session.status === 'waiting_approval'}
                  />
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.68)' },
  sheet: {
    maxHeight: '74%',
    minHeight: '42%',
    backgroundColor: tokens.color.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    paddingHorizontal: tokens.space.md,
    paddingTop: tokens.space.xs,
    paddingBottom: tokens.space.md,
  },
  handleWrap: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 48, height: 5, borderRadius: 999, backgroundColor: tokens.color.borderStrong },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap' },
  headerCopy: { flex: 1, paddingRight: 8 },
  title: { color: tokens.color.text, fontWeight: '700', fontSize: 18 },
  subtitle: { color: tokens.color.textMuted, fontSize: 12, marginTop: 4 },
  projectMeta: { color: tokens.color.mono, fontSize: 12, fontFamily: tokens.type.mono, marginTop: 6 },
  headerActions: { alignItems: 'flex-end', gap: 6, maxWidth: '48%' },
  compactMeta: { color: tokens.color.textSoft, backgroundColor: tokens.color.chip, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontFamily: tokens.type.mono },
  compactMetaWarn: { color: '#fdba74', backgroundColor: '#31200f' },
  newButton: { color: tokens.color.text, backgroundColor: tokens.color.primarySoft, borderWidth: 1, borderColor: tokens.color.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, overflow: 'hidden', fontWeight: '700' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  filterChip: { backgroundColor: tokens.color.chip, borderWidth: 1, borderColor: tokens.color.border, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  filterChipActive: { backgroundColor: tokens.color.primarySoft, borderColor: tokens.color.primary },
  filterChipText: { color: tokens.color.textSoft, fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: tokens.color.text },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  summaryText: { color: tokens.color.textMuted, fontSize: 11, fontFamily: tokens.type.mono },
  scroll: { flex: 1 },
  list: { gap: 10, paddingBottom: 10 },
  stateCard: { backgroundColor: tokens.color.panelAlt, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.md, padding: tokens.space.md, gap: 8 },
  disconnectedCard: { borderColor: '#9a3412', backgroundColor: '#2a1a10' },
  stateTitle: { color: tokens.color.text, fontWeight: '700' },
  stateText: { color: tokens.color.textMuted, lineHeight: 18 },
  inlineAction: { color: tokens.color.text, backgroundColor: tokens.color.primarySoft, borderWidth: 1, borderColor: tokens.color.primary, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, overflow: 'hidden', alignSelf: 'flex-start', fontWeight: '700' },
});
