import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';
import { ToolCallInfo } from '../types';

const TOOL_ICONS: Record<string, string> = {
  edit: 'create-outline',
  read: 'document-text-outline',
  write: 'save-outline',
  bash: 'terminal-outline',
  grep: 'search-outline',
  glob: 'folder-open-outline',
  lsp_diagnostics: 'bug-outline',
  lsp_rename: 'text-outline',
  lsp_goto_definition: 'navigate-outline',
  lsp_find_references: 'link-outline',
  ast_grep_search: 'code-slash-outline',
  ast_grep_replace: 'swap-horizontal-outline',
  task: 'git-branch-outline',
  look_at: 'eye-outline',
  question: 'help-circle-outline',
};

function getToolIcon(tool: string): string {
  return TOOL_ICONS[tool] || 'construct-outline';
}

function getStatusColor(status: ToolCallInfo['status']) {
  if (status === 'running') return { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' };
  if (status === 'error') return { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' };
  return { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' };
}

export function ToolCallCard({ toolCall }: { toolCall: ToolCallInfo }) {
  const [expanded, setExpanded] = useState(false);
  const colors = getStatusColor(toolCall.status);
  const displayTitle = toolCall.title || toolCall.tool;

  return (
    <TouchableOpacity
      style={[styles.wrap, { backgroundColor: colors.bg, borderColor: colors.border }]}
      onPress={() => setExpanded((prev) => !prev)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Ionicons name={getToolIcon(toolCall.tool) as any} size={14} color={colors.text} />
        <Text style={[styles.toolName, { color: colors.text }]} numberOfLines={1}>{displayTitle}</Text>
        {toolCall.status === 'running' && (
          <Ionicons name="sync-outline" size={12} color={colors.text} />
        )}
        {toolCall.status === 'completed' && (
          <Ionicons name="checkmark-circle-outline" size={12} color={colors.text} />
        )}
        {toolCall.status === 'error' && (
          <Ionicons name="alert-circle-outline" size={12} color={colors.text} />
        )}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={tokens.color.textMuted}
        />
      </View>
      {expanded && (
        <View style={styles.detail}>
          {toolCall.input && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Input</Text>
              <Text style={styles.mono} numberOfLines={8}>
                {JSON.stringify(toolCall.input, null, 2)}
              </Text>
            </View>
          )}
          {toolCall.output && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Output</Text>
              <Text style={styles.mono} numberOfLines={8}>{toolCall.output}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  detail: {
    marginTop: 8,
    gap: 8,
  },
  section: {
    gap: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: tokens.color.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  mono: {
    fontSize: 11,
    fontFamily: tokens.type.mono,
    color: tokens.color.textSoft,
    lineHeight: 16,
  },
});
