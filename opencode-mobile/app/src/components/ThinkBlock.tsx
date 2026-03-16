import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';

export function ThinkBlock({ thinking }: { thinking: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = thinking.slice(0, 80).replace(/\n/g, ' ');

  return (
    <TouchableOpacity
      style={styles.wrap}
      onPress={() => setExpanded((prev) => !prev)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Ionicons name="bulb-outline" size={14} color="#a78bfa" />
        <Text style={styles.label}>Thinking</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={tokens.color.textMuted}
        />
      </View>
      {expanded ? (
        <Text style={styles.fullText}>{thinking}</Text>
      ) : (
        <Text style={styles.preview} numberOfLines={1}>{preview}…</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7c3aed',
    flex: 1,
  },
  preview: {
    fontSize: 12,
    color: '#a78bfa',
    lineHeight: 16,
    opacity: 0.7,
  },
  fullText: {
    fontSize: 12,
    color: '#6d28d9',
    lineHeight: 18,
    opacity: 0.85,
  },
});
