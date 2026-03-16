import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProjectSession } from '../types';
import { tokens } from '../theme/tokens';
import { ThreadCard } from './ThreadCard';

type RailState = 'ready' | 'loading' | 'disconnected';
type FilterKey = 'all' | 'active' | 'running' | 'waiting' | 'errors' | 'cancelled' | 'idle';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'running', label: 'Running' },
  { key: 'waiting', label: 'Waiting' },
  { key: 'errors', label: 'Errors' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'idle', label: 'Idle' },
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
    case 'active': return 'No active thread selected in this project.';
    case 'running': return 'No running threads in this project.';
    case 'waiting': return 'No waiting approval threads in this project.';
    case 'errors': return 'No error threads in this project.';
    case 'cancelled': return 'No cancelled threads in this project.';
    case 'idle': return 'No idle threads in this project.';
    default: return 'This project has no threads yet. Start a new task to create the first isolated run.';
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
  const [filtersVisible, setFiltersVisible] = useState(false);
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
              <Text style={styles.title}>Threads</Text>
              <Text style={styles.subtitle}>{projectName || 'Current project'} · {sessions.length} thread{sessions.length === 1 ? '' : 's'}</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.filterButton, filtersVisible && styles.filterButtonActive]}
                onPress={() => setFiltersVisible((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Ionicons name="funnel-outline" size={16} color={filtersVisible ? '#2563eb' : tokens.color.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.newButton} onPress={onCreateSession} activeOpacity={0.7}>
                <Ionicons name="add" size={18} color="#ffffff" />
                <Text style={styles.newButtonText}>New</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={tokens.color.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {filtersVisible && (
            <View style={styles.filterRow}>
              {FILTERS.map((item) => (
                <Pressable key={item.key} onPress={() => setFilter(item.key)} style={[styles.filterChip, filter === item.key && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, filter === item.key && styles.filterChipTextActive]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {filter !== 'all' && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterIndicatorText}>Showing {filteredSessions.length} of {sessions.length} · {filter}</Text>
              <TouchableOpacity onPress={() => setFilter('all')}>
                <Text style={styles.clearFilter}>Clear</Text>
              </TouchableOpacity>
            </View>
          )}

          {state === 'loading' ? (
            <View style={styles.stateCard}>
              <Ionicons name="sync-outline" size={20} color={tokens.color.textMuted} />
              <Text style={styles.stateText}>Loading threads...</Text>
            </View>
          ) : !sessions.length || !filteredSessions.length ? (
            <View style={styles.stateCard}>
              <Ionicons name="chatbubbles-outline" size={24} color={tokens.color.textMuted} />
              <Text style={styles.stateTitle}>{!sessions.length ? 'No threads yet' : `No ${filter} threads`}</Text>
              <Text style={styles.stateText}>{emptyCopy(filter)}</Text>
              {!sessions.length && (
                <TouchableOpacity style={styles.createFirstButton} onPress={onCreateSession} activeOpacity={0.7}>
                  <Text style={styles.createFirstText}>Create first thread</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list}>
              {state === 'disconnected' && (
                <View style={styles.disconnectedCard}>
                  <Ionicons name="cloud-offline-outline" size={16} color="#dc2626" />
                  <Text style={styles.disconnectedText}>Connection lost. Thread state is preserved.</Text>
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    maxHeight: '74%',
    minHeight: '42%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  handleWrap: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: '#d1d5db' },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 16 },
  headerCopy: { flex: 1 },
  title: { color: tokens.color.text, fontWeight: '700', fontSize: 20 },
  subtitle: { color: tokens.color.textMuted, fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  newButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#000000', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  newButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  closeButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  filterChipActive: { backgroundColor: '#000000' },
  filterChipText: { color: tokens.color.textSoft, fontSize: 13, fontWeight: '600' },
  filterChipTextActive: { color: '#ffffff' },
  filterIndicator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4 },
  filterIndicatorText: { color: tokens.color.textMuted, fontSize: 12 },
  clearFilter: { color: '#2563eb', fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  list: { gap: 8, paddingBottom: 10 },
  stateCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 8 },
  stateTitle: { color: tokens.color.text, fontWeight: '600', fontSize: 16 },
  stateText: { color: tokens.color.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },
  createFirstButton: { marginTop: 8, backgroundColor: '#000000', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  createFirstText: { color: '#ffffff', fontWeight: '600' },
  disconnectedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: 16, padding: 12, marginBottom: 4 },
  disconnectedText: { color: '#991b1b', fontSize: 13, fontWeight: '500', flex: 1 },
});
