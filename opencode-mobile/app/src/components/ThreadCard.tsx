import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    <Pressable onPress={onPress} style={[styles.card, active && styles.active]}>
      <View style={styles.topRow}>
        <View style={[styles.statusIconWrap, { backgroundColor: statusBg(session.status) }]}>
          <Ionicons name={statusIcon(session.status)} size={16} color={statusColor(session.status)} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{session.title}</Text>
            <Text style={styles.time}>{formatTime(session.updatedAt)}</Text>
          </View>
          <Text style={styles.summary} numberOfLines={2}>{summary}</Text>
          <View style={styles.metaRow}>
            <View style={[styles.statusBadge, { backgroundColor: statusBg(session.status) }]}>
              <Text style={[styles.statusText, { color: statusColor(session.status) }]}>{session.status}</Text>
            </View>
            {changedFilesCount > 0 && (
              <Text style={styles.filesMeta}>{changedFilesCount} file{changedFilesCount === 1 ? '' : 's'}</Text>
            )}
            {approvalPending && (
              <View style={styles.approvalBadge}>
                <View style={styles.approvalDot} />
                <Text style={styles.approvalText}>Approval</Text>
              </View>
            )}
          </View>
          {!!session.lastError && <Text style={styles.errorText} numberOfLines={1}>{session.lastError}</Text>}
        </View>
        <Ionicons name="chevron-forward" size={16} color={tokens.color.textMuted} style={{ marginLeft: 4 }} />
      </View>
    </Pressable>
  );
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
    case 'running': return '#2563eb';
    case 'waiting_approval': return '#d97706';
    case 'cancelled': return '#6b7280';
    case 'disconnected': return '#dc2626';
    case 'error': return '#dc2626';
    default: return '#6b7280';
  }
}

function statusBg(status: ProjectSession['status']) {
  switch (status) {
    case 'running': return '#eff6ff';
    case 'waiting_approval': return '#fffbeb';
    case 'cancelled': return '#f9fafb';
    case 'disconnected': return '#fef2f2';
    case 'error': return '#fef2f2';
    default: return '#f3f4f6';
  }
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    padding: 14,
  },
  active: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  statusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: tokens.color.text,
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
  },
  time: {
    color: tokens.color.textMuted,
    fontSize: 12,
  },
  summary: {
    color: tokens.color.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  filesMeta: {
    color: tokens.color.textMuted,
    fontSize: 11,
  },
  approvalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  approvalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  approvalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#d97706',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 2,
  },
});
