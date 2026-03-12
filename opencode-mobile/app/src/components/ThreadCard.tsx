import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProjectSession } from '../types';
import { tokens } from '../theme/tokens';
import { formatTime } from '../format';

export function ThreadCard({
  session,
  active,
  onPress,
  onResume,
  onCancel,
  summary,
  changedFilesCount,
  approvalPending,
}: {
  session: ProjectSession;
  active: boolean;
  onPress: () => void;
  onResume: () => void;
  onCancel: () => void;
  summary: string;
  changedFilesCount: number;
  approvalPending: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const canCancel = session.status === 'running' || session.status === 'waiting_approval';

  return (
    <Pressable onPress={onPress} style={[styles.card, active && styles.active, session.status === 'waiting_approval' && styles.waiting, session.status === 'error' && styles.error, session.status === 'cancelled' && styles.cancelled, session.status === 'disconnected' && styles.disconnected]}>
      <View style={styles.topRow}>
        <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
        <View style={styles.topActions}>
          <View style={[styles.badgeWrap, badgeStyle(session.status)]}>
            <Ionicons name={statusIcon(session.status)} size={12} color={statusColor(session.status)} />
            <Text style={[styles.badge, { color: statusColor(session.status) }]}>{session.status}</Text>
          </View>
          <Pressable hitSlop={8} onPress={() => setMenuOpen((prev) => !prev)} style={styles.kebabButton} accessibilityLabel="More thread actions">
            <Ionicons name="ellipsis-horizontal" size={16} color={tokens.color.textSoft} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.summary} numberOfLines={2}>{summary}</Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>updated <Text style={styles.mono}>{formatTime(session.updatedAt)}</Text></Text>
        <Text style={styles.meta}>files <Text style={styles.mono}>{changedFilesCount}</Text></Text>
      </View>
      <View style={styles.indicators}>
        {approvalPending && <View style={[styles.flagRow, styles.waitingFlag]}><Ionicons name="shield-outline" size={11} color="#fcd34d" /><Text style={[styles.flag, styles.flagTextWaiting]}>APPROVAL</Text></View>}
        {!!session.lastError && <View style={[styles.flagRow, styles.errorFlag]}><Ionicons name="alert-circle-outline" size={11} color="#fca5a5" /><Text style={[styles.flag, styles.flagTextError]}>ERROR</Text></View>}
        {active && <View style={[styles.flagRow, styles.activeFlag]}><Ionicons name="locate-outline" size={11} color={tokens.color.text} /><Text style={[styles.flag, styles.flagTextActive]}>선택됨</Text></View>}
      </View>
      {!!session.lastError && <Text style={styles.errorText} numberOfLines={2}>{session.lastError}</Text>}
      {menuOpen && (
        <View style={styles.menu}>
          <Pressable onPress={() => { setMenuOpen(false); onPress(); }} style={styles.menuButton}><Ionicons name="open-outline" size={14} color={tokens.color.text} /><Text style={styles.menuButtonText}>Open</Text></Pressable>
          <Pressable onPress={() => { setMenuOpen(false); onResume(); }} style={styles.menuButton}><Ionicons name="play-back-outline" size={14} color={tokens.color.text} /><Text style={styles.menuButtonText}>이어하기</Text></Pressable>
          <Pressable disabled={!canCancel} onPress={() => { setMenuOpen(false); if (canCancel) onCancel(); }} style={[styles.menuButton, !canCancel && styles.menuButtonDisabled]}>
            <Ionicons name="close-circle-outline" size={14} color={!canCancel ? tokens.color.textMuted : tokens.color.text} /><Text style={[styles.menuButtonText, !canCancel && styles.menuButtonTextDisabled]}>취소</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function badgeStyle(status: ProjectSession['status']) {
  switch (status) {
    case 'running': return styles.runningBadge;
    case 'waiting_approval': return styles.waitingBadge;
    case 'cancelled': return styles.cancelledBadge;
    case 'disconnected': return styles.disconnectedBadge;
    case 'error': return styles.errorBadge;
    default: return styles.idleBadge;
  }
}

function statusIcon(status: ProjectSession['status']) {
  switch (status) {
    case 'running': return 'play-circle-outline';
    case 'waiting_approval': return 'time-outline';
    case 'cancelled': return 'close-circle-outline';
    case 'disconnected': return 'cloud-offline-outline';
    case 'error': return 'alert-circle-outline';
    default: return 'pause-circle-outline';
  }
}

function statusColor(status: ProjectSession['status']) {
  switch (status) {
    case 'running': return '#86efac';
    case 'waiting_approval': return '#fcd34d';
    case 'cancelled': return '#ddd6fe';
    case 'disconnected': return '#fdba74';
    case 'error': return '#fca5a5';
    default: return tokens.color.textSoft;
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.color.panelAlt,
    borderWidth: 1,
    borderColor: tokens.color.border,
    borderRadius: tokens.radius.md,
    padding: tokens.space.sm,
    gap: 8,
  },
  active: { borderColor: tokens.color.primary, backgroundColor: tokens.color.primarySoft, shadowColor: '#3f82ff', shadowOpacity: 0.18, shadowRadius: 8 },
  waiting: { borderColor: '#8a5b10' },
  error: { borderColor: '#7f1d1d' },
  cancelled: { borderColor: '#5b3aa6' },
  disconnected: { borderColor: '#9a3412' },
  topRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { color: tokens.color.text, fontWeight: '700', fontSize: 14, flex: 1 },
  summary: { color: tokens.color.textSoft, fontSize: 12, lineHeight: 17 },
  metaRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  meta: { color: tokens.color.textMuted, fontSize: 11 },
  mono: { fontFamily: tokens.type.mono, color: tokens.color.mono },
  indicators: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  badgeWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badge: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  idleBadge: { backgroundColor: '#203046' },
  runningBadge: { backgroundColor: '#113520' },
  waitingBadge: { backgroundColor: '#3b2a10' },
  cancelledBadge: { backgroundColor: '#29183d' },
  disconnectedBadge: { backgroundColor: '#342112' },
  errorBadge: { backgroundColor: '#3a1515' },
  flag: { fontSize: 10, fontWeight: '700' },
  flagRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  flagTextWaiting: { color: '#fcd34d' },
  flagTextError: { color: '#fca5a5' },
  flagTextActive: { color: tokens.color.text },
  waitingFlag: { backgroundColor: '#3b2a10' },
  errorFlag: { backgroundColor: '#3a1515' },
  activeFlag: { backgroundColor: '#16336e' },
  kebabButton: { backgroundColor: tokens.color.chip, borderWidth: 1, borderColor: tokens.color.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, minWidth: 34, alignItems: 'center' },
  kebabText: { color: tokens.color.textSoft, fontSize: 14, fontWeight: '700' },
  errorText: { color: '#fca5a5', fontSize: 11, lineHeight: 16 },
  menu: { flexDirection: 'row', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  menuButton: { backgroundColor: tokens.color.chip, borderWidth: 1, borderColor: tokens.color.borderStrong, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  menuButtonDisabled: { opacity: 0.45 },
  menuButtonText: { color: tokens.color.text, fontWeight: '700', fontSize: 12 },
  menuButtonTextDisabled: { color: tokens.color.textMuted },
});
