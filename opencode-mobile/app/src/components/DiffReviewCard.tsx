import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
      <View style={styles.header}>
        <Text style={styles.path}>{path}</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
      <Text style={styles.stats}>+{additions} / -{deletions}</Text>
      <Text style={styles.preview} numberOfLines={8}>{preview}</Text>
      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.reject]} onPress={onReject}><Text style={styles.buttonText}>Reject</Text></Pressable>
        <Pressable style={[styles.button, styles.apply]} onPress={onApply}><Text style={styles.buttonText}>Apply</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.color.panelAlt, borderWidth: 1, borderColor: tokens.color.border, borderRadius: tokens.radius.md, padding: tokens.space.md, gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  path: { flex: 1, color: tokens.color.text, fontFamily: tokens.type.mono },
  status: { color: tokens.color.textMuted, fontSize: 12, textTransform: 'uppercase' },
  stats: { color: tokens.color.textMuted, fontFamily: tokens.type.mono, fontSize: 12 },
  preview: { color: tokens.color.textSoft, fontFamily: tokens.type.mono, fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  button: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  reject: { backgroundColor: '#3a1515' },
  apply: { backgroundColor: '#123424' },
  buttonText: { color: tokens.color.text, fontWeight: '700' },
});
