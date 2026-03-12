import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { TaskStatusEvent, ProjectSession } from '../types';
import { tokens } from '../theme/tokens';

function runtimeTone(status?: ProjectSession['status'] | null, connectionStatus?: 'disconnected' | 'connecting' | 'connected', error?: string | null) {
  if (error || status === 'error') return { label: 'Error', icon: 'alert-circle-outline' as const, color: '#fca5a5', bg: '#3a1118', border: '#7f1d1d' };
  if (status === 'disconnected' || connectionStatus === 'disconnected') return { label: 'Disconnected', icon: 'cloud-offline-outline' as const, color: '#fdba74', bg: '#31200f', border: '#9a3412' };
  if (status === 'waiting_approval') return { label: 'Waiting approval', icon: 'time-outline' as const, color: '#fde68a', bg: '#33240f', border: '#a16207' };
  if (status === 'cancelled') return { label: 'Cancelled', icon: 'close-circle-outline' as const, color: '#ddd6fe', bg: '#24163c', border: '#6d28d9' };
  if (connectionStatus === 'connecting') return { label: 'Connecting', icon: 'sync-outline' as const, color: '#fde68a', bg: '#2e2610', border: '#a16207' };
  if (status === 'running') return { label: 'Running', icon: 'play-circle-outline' as const, color: '#86efac', bg: '#0f2d1c', border: '#166534' };
  return { label: 'Idle', icon: 'pause-circle-outline' as const, color: tokens.color.textSoft, bg: tokens.color.chip, border: tokens.color.borderStrong };
}

export function RuntimeStateCard({
  connectionStatus,
  sessionStatus,
  taskStatus,
  error,
  expanded,
  onToggle,
  executionTarget,
}: {
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  sessionStatus?: ProjectSession['status'] | null;
  taskStatus: TaskStatusEvent | null;
  error?: string | null;
  expanded: boolean;
  onToggle: () => void;
  executionTarget?: string;
}) {
  const tone = runtimeTone(sessionStatus, connectionStatus, error);

  return (
    <View style={[styles.card, { borderColor: tone.border }]}> 
      <TouchableOpacity activeOpacity={0.9} onPress={onToggle}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>Runtime state</Text>
              <View style={[styles.badgeRow, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                <Ionicons name={tone.icon} size={13} color={tone.color} />
                <Text style={[styles.badge, { color: tone.color }]}>{tone.label}</Text>
              </View>
            </View>
            <Text style={styles.summary}>target {executionTarget || 'local'} · connection {connectionStatus} · thread {sessionStatus || 'idle'}</Text>
          </View>
          <Text style={styles.toggle}>{expanded ? 'Hide' : 'Show'}</Text>
        </View>
      </TouchableOpacity>

      {expanded ? (
        <View style={styles.body}>
          <Text style={styles.line}>Execution target: <Text style={styles.mono}>{executionTarget || 'local'}</Text></Text>
          <Text style={styles.line}>Connection: <Text style={styles.mono}>{connectionStatus}</Text></Text>
          <Text style={styles.line}>Thread status: <Text style={styles.mono}>{sessionStatus || 'idle'}</Text></Text>
          <Text style={styles.line}>Runtime event: <Text style={styles.mono}>{taskStatus?.status || 'none'}</Text></Text>
          {sessionStatus === 'waiting_approval' && <Text style={styles.waiting}>Approval pending. Runtime is paused until you approve or deny the requested action.</Text>}
          {sessionStatus === 'cancelled' && <Text style={styles.cancelled}>This run was cancelled. You can resume the thread or send a new instruction.</Text>}
          {connectionStatus === 'disconnected' && <Text style={styles.disconnected}>Connection is unavailable. Thread context is preserved, but runtime work is paused.</Text>}
          {!!taskStatus?.tool && <Text style={styles.line}>Tool: <Text style={styles.mono}>{taskStatus.tool}</Text></Text>}
          {!!taskStatus?.state?.title && <Text style={styles.line}>Action: {taskStatus.state.title}</Text>}
          {!!taskStatus?.state?.output && <Text style={styles.output}>{taskStatus.state.output.trim()}</Text>}
          {!!error && <Text style={styles.error}>Error: {error}</Text>}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.color.panel, borderRadius: tokens.radius.lg, borderWidth: 1, padding: tokens.space.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  copy: { flex: 1, paddingRight: 8 },
  titleRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  title: { color: tokens.color.text, fontSize: 17, fontWeight: '700' },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  badge: { fontSize: 11, fontWeight: '700' },
  summary: { color: tokens.color.textMuted, fontSize: 12, marginTop: 6, fontFamily: tokens.type.mono },
  toggle: { color: tokens.color.textSoft, backgroundColor: tokens.color.chip, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  body: { marginTop: 12, gap: 6 },
  line: { color: tokens.color.textSoft, lineHeight: 18 },
  mono: { fontFamily: tokens.type.mono, color: tokens.color.mono },
  waiting: { color: '#fde68a', backgroundColor: '#33240f', borderColor: '#a16207', borderWidth: 1, borderRadius: 12, padding: 10 },
  cancelled: { color: '#ddd6fe', backgroundColor: '#24163c', borderColor: '#6d28d9', borderWidth: 1, borderRadius: 12, padding: 10 },
  disconnected: { color: '#fdba74', backgroundColor: '#31200f', borderColor: '#9a3412', borderWidth: 1, borderRadius: 12, padding: 10 },
  output: { color: tokens.color.text, backgroundColor: tokens.color.panelAlt, borderWidth: 1, borderColor: tokens.color.border, borderRadius: 12, padding: 10, fontFamily: tokens.type.mono },
  error: { color: '#fca5a5' },
});
