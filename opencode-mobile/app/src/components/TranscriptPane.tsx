import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChatMessage } from '../types';
import { formatTime } from '../format';
import { tokens } from '../theme/tokens';

export function TranscriptPane({ messages, loading }: { messages: ChatMessage[]; loading?: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Thread transcript</Text>
        <Text style={styles.subtitle}>Execution-facing prompt and output pane</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Loading thread state</Text>
            <Text style={styles.emptyText}>Hydrating transcript, runtime logs, and review artifacts...</Text>
          </View>
        ) : !messages.length ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>Empty thread transcript</Text>
            <Text style={styles.emptyText}>Send a task prompt to start the active thread.</Text>
          </View>
        ) : (
          messages.map((message) => (
            <View key={message.id} style={[styles.entry, message.role === 'user' ? styles.userEntry : styles.outputEntry]}>
              <View style={styles.entryHeader}>
                <Text style={styles.role}>{message.role}</Text>
                <Text style={styles.time}>{formatTime(message.createdAt)}</Text>
              </View>
              <Text style={styles.text}>{message.text}{message.pending ? '▍' : ''}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.color.panel, borderRadius: tokens.radius.lg, borderWidth: 1, borderColor: tokens.color.border, padding: tokens.space.md, minHeight: 240 },
  header: { marginBottom: 10 },
  title: { color: tokens.color.text, fontWeight: '700', fontSize: 16 },
  subtitle: { color: tokens.color.textMuted, fontSize: 12, marginTop: 4 },
  scroll: { maxHeight: 300 },
  content: { gap: 8, paddingBottom: 6 },
  emptyWrap: { paddingVertical: 28, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: tokens.color.text, fontWeight: '700', fontSize: 15 },
  emptyText: { color: tokens.color.textMuted, marginTop: 8, lineHeight: 19, textAlign: 'center' },
  entry: { borderRadius: tokens.radius.md, borderWidth: 1, padding: 10 },
  userEntry: { backgroundColor: '#122856', borderColor: '#23457e' },
  outputEntry: { backgroundColor: tokens.color.panelAlt, borderColor: tokens.color.border },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  role: { color: tokens.color.textSoft, textTransform: 'uppercase', fontSize: 10, fontWeight: '700', fontFamily: tokens.type.mono },
  time: { color: tokens.color.textMuted, fontSize: 11, fontFamily: tokens.type.mono },
  text: { color: tokens.color.text, lineHeight: 19, fontSize: 13 },
});
