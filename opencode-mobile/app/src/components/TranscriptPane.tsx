import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ChatMessage } from '../types';
import { formatTime } from '../format';
import { tokens } from '../theme/tokens';
import { ThinkBlock } from './ThinkBlock';
import { ToolCallCard } from './ToolCallCard';

export function TranscriptPane({ messages, loading }: { messages: ChatMessage[]; loading?: boolean }) {
  if (loading) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Ionicons name="terminal-outline" size={28} color={tokens.color.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Loading workspace...</Text>
        <Text style={styles.emptyText}>Hydrating transcript and runtime logs...</Text>
      </View>
    );
  }

  if (!messages.length) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIcon}>
          <Ionicons name="terminal-outline" size={28} color={tokens.color.textMuted} />
        </View>
        <Text style={styles.emptyTitle}>Ready to code</Text>
        <Text style={styles.emptyText}>Describe your task or paste an error message to begin.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {messages.map((message) =>
        message.role === 'user' ? (
          <View key={message.id} style={styles.userRow}>
            <View style={styles.userBubble}>
              <Text style={styles.userText}>{message.text}</Text>
            </View>
          </View>
        ) : (
          <View key={message.id} style={styles.agentBlock}>
            <View style={styles.agentHeader}>
              <View style={styles.agentAvatar}>
                <Ionicons name="terminal-outline" size={12} color="#ffffff" />
              </View>
              <Text style={styles.agentLabel}>{message.agent || 'Agent'}</Text>
            </View>
            <View style={styles.agentCard}>
              <View style={styles.agentCardBody}>
                {!!message.thinking && (
                  <ThinkBlock thinking={message.thinking} />
                )}
                {!!message.toolCalls?.length && message.toolCalls.map((tc, i) => (
                  <ToolCallCard key={tc.callID || `tc_${i}`} toolCall={tc} />
                ))}
                <Text style={styles.agentText}>{message.text}{message.pending ? '▍' : ''}</Text>
              </View>
              <View style={styles.agentCardFooter}>
                <Text style={styles.agentTime}>{formatTime(message.createdAt)}</Text>
              </View>
            </View>
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
    paddingVertical: 4,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: tokens.color.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: tokens.color.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
  // User message - black bubble, right aligned
  userRow: {
    alignItems: 'flex-end',
  },
  userBubble: {
    backgroundColor: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderTopRightRadius: 4,
    maxWidth: '85%',
  },
  userText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
  },
  // Agent message - avatar + card
  agentBlock: {
    gap: 8,
    maxWidth: '95%',
  },
  agentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  agentAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
  },
  agentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: tokens.color.textSoft,
  },
  agentCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    overflow: 'hidden',
  },
  agentCardBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  agentText: {
    fontSize: 14,
    lineHeight: 22,
    color: tokens.color.textSoft,
  },
  agentCardFooter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  agentTime: {
    fontSize: 11,
    color: tokens.color.textMuted,
    fontFamily: tokens.type.mono,
  },
});
