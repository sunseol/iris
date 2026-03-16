import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';

export function DiffReviewCard({
  path,
  additions,
  deletions,
  preview,
  status,
  onApply,
  onReject,
}: {
  path: string;
  additions: number;
  deletions: number;
  preview: string;
  status: 'pending' | 'applied' | 'rejected';
  onApply: () => void;
  onReject: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.fileRow}>
        <View style={styles.fileIconWrap}>
          <Ionicons name="code-slash-outline" size={16} color={tokens.color.textMuted} />
        </View>
        <View style={styles.fileInfo}>
          <Text style={styles.path} numberOfLines={1}>{path}</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statAdd}>+{additions}</Text>
            <Text style={styles.statDel}>-{deletions}</Text>
            <Text style={styles.statusBadge}>{status}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.preview} numberOfLines={8}>{preview}</Text>
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.reject]} onPress={onReject}>
          <Ionicons name="close" size={16} color="#dc2626" />
          <Text style={styles.rejectText}>Reject</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.apply]} onPress={onApply}>
          <Ionicons name="checkmark" size={16} color="#ffffff" />
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    padding: 14,
    gap: 10,
  },
  fileRow: {
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
  fileInfo: {
    flex: 1,
    gap: 4,
  },
  path: {
    color: tokens.color.text,
    fontFamily: tokens.type.mono,
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  statAdd: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statDel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
  },
  preview: {
    color: tokens.color.textSoft,
    fontFamily: tokens.type.mono,
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  reject: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  apply: {
    backgroundColor: '#000000',
  },
  rejectText: {
    color: '#dc2626',
    fontWeight: '600',
  },
  applyText: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
