import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ProjectSession } from '../types';
import { colors } from '../theme';
import { formatRuntimeSessionID, formatStatus, formatTime } from '../format';

type SessionRailMeta = {
  messageCount: number;
  turnCount: number;
  lastActivityLabel: string;
};

export function SessionRail({
  projectName,
  sessions,
  activeSessionId,
  sessionMeta,
  onSelectSession,
  onCreateSession,
}: {
  projectName?: string | null;
  sessions: ProjectSession[];
  activeSessionId: string | null;
  sessionMeta: Record<string, SessionRailMeta>;
  onSelectSession: (sessionId: string) => void;
  onCreateSession: () => void;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Project sessions</Text>
          <Text style={styles.subtitle}>{projectName || 'Current project'} · {sessions.length} session{sessions.length === 1 ? '' : 's'}</Text>
        </View>
        <TouchableOpacity onPress={onCreateSession} style={styles.newButton}>
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {!sessions.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No sessions in this project</Text>
          <Text style={styles.emptyText}>Create a new session to start work inside the active project namespace.</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
          {sessions.map((session) => {
            const active = session.id === activeSessionId;
            const meta = sessionMeta[session.id] || { messageCount: 0, turnCount: 0, lastActivityLabel: 'No activity yet' };
            const pillLabel = session.status === 'waiting_approval'
              ? 'Waiting approval'
              : session.status === 'cancelled'
                ? 'Cancelled'
                : session.status === 'error' && session.lastError === 'Approval denied'
                  ? 'Denied'
                  : active
                    ? 'Active'
                    : formatStatus(session.status);
            return (
              <TouchableOpacity key={session.id} activeOpacity={0.9} onPress={() => onSelectSession(session.id)} style={[styles.card, active && styles.cardActive, session.status === 'error' && styles.cardError, session.status === 'waiting_approval' && styles.cardWaiting, session.status === 'cancelled' && styles.cardCancelled, session.status === 'disconnected' && styles.cardDisconnected]}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={[styles.pill, active && styles.pillActive, session.status === 'waiting_approval' && styles.pillWaiting, session.status === 'error' && styles.pillError, session.status === 'cancelled' && styles.pillCancelled, session.status === 'disconnected' && styles.pillDisconnected]}>{pillLabel}</Text>
                </View>
                <Text style={styles.meta}>Updated {formatTime(session.updatedAt)} · Runtime {formatRuntimeSessionID(session.runtimeSessionID)}</Text>
                <Text style={styles.meta}>Activity {meta.lastActivityLabel}</Text>
                <Text style={styles.meta}>Messages {meta.messageCount} · Turns {meta.turnCount}</Text>
                {!!session.lastTool && <Text style={styles.meta}>Tool {session.lastTool}</Text>}
                {!!session.lastError && <Text style={styles.errorMeta}>{session.lastError}</Text>}
                {!!session.lastMessagePreview && <Text style={styles.preview}>{session.lastMessagePreview}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontWeight: '700', fontSize: 16 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  newButton: { backgroundColor: '#13213d', borderWidth: 1, borderColor: colors.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  newButtonText: { color: colors.text, fontWeight: '700' },
  emptyState: { backgroundColor: colors.panelAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14 },
  emptyTitle: { color: colors.text, fontWeight: '700' },
  emptyText: { color: colors.textMuted, marginTop: 6, lineHeight: 18 },
  railContent: { gap: 10, paddingRight: 6 },
  card: { width: 270, backgroundColor: colors.panelAlt, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border },
  cardActive: { borderColor: colors.primary, backgroundColor: '#101d38' },
  cardWaiting: { borderColor: '#a16207', backgroundColor: '#2b2110' },
  cardCancelled: { borderColor: '#6d28d9', backgroundColor: '#1f1735' },
  cardDisconnected: { borderColor: '#9a3412', backgroundColor: '#2d1d12' },
  cardError: { borderColor: '#7f1d1d', backgroundColor: '#2a1218' },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  sessionTitle: { color: colors.text, fontWeight: '700', fontSize: 14, flex: 1 },
  pill: { color: colors.textSoft, backgroundColor: '#1e293b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 11 },
  pillActive: { backgroundColor: '#16336e', color: colors.text },
  pillWaiting: { backgroundColor: '#33240f', color: '#fde68a' },
  pillCancelled: { backgroundColor: '#24163c', color: '#ddd6fe' },
  pillDisconnected: { backgroundColor: '#31200f', color: '#fdba74' },
  pillError: { backgroundColor: '#3a1118', color: '#fca5a5' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  errorMeta: { color: '#fca5a5', fontSize: 12, marginTop: 6 },
  preview: { color: colors.textSoft, fontSize: 12, marginTop: 8, lineHeight: 16 },
});
