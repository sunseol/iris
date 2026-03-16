import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';

type Props = {
  projectName: string;
  workspacePath: string;
  executionTarget?: string;
  model: string;
  authState: string;
  connectionState: string;
  threadStatus: string;
  activeAgent?: string | null;
  onOpenProjects?: () => void;
  onOpenSettings?: () => void;
};

function getStatusColor(connectionState: string, threadStatus: string) {
  if (connectionState === 'disconnected') return { dot: '#ef4444', label: 'Disconnected' };
  if (connectionState === 'connecting') return { dot: '#9ca3af', label: 'Connecting' };
  if (threadStatus === 'running') return { dot: '#3b82f6', label: 'Running' };
  if (threadStatus === 'waiting_approval') return { dot: '#f59e0b', label: 'Approval' };
  if (threadStatus === 'error') return { dot: '#ef4444', label: 'Error' };
  if (threadStatus === 'cancelled') return { dot: '#6b7280', label: 'Cancelled' };
  return { dot: '#22c55e', label: 'Idle' };
}

export function TopStatusBar({ projectName, connectionState, threadStatus, activeAgent, onOpenProjects, onOpenSettings }: Props) {
  const status = getStatusColor(connectionState, threadStatus);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity style={styles.projectTrigger} onPress={onOpenProjects} activeOpacity={0.7}>
        <View style={styles.projectIcon}>
          <Ionicons name="terminal-outline" size={18} color="#ffffff" />
        </View>
        <View style={styles.projectCopy}>
          <Text style={styles.projectLabel}>PROJECT</Text>
          <View style={styles.projectNameRow}>
            <Text style={styles.projectName} numberOfLines={1}>{projectName}</Text>
            <Ionicons name="chevron-down" size={14} color={tokens.color.textMuted} />
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.rightSection}>
        {!!activeAgent && (
          <View style={styles.agentPill}>
            <Ionicons name="git-branch-outline" size={12} color="#6366f1" />
            <Text style={styles.agentPillLabel} numberOfLines={1}>{activeAgent}</Text>
          </View>
        )}
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: status.dot }]} />
          <Text style={styles.statusLabel}>{status.label}</Text>
        </View>
        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={20} color={tokens.color.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  projectTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  projectIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectCopy: {
    gap: 1,
  },
  projectLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: tokens.color.textMuted,
    letterSpacing: 0.5,
  },
  projectNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: tokens.color.text,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: tokens.color.textSoft,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 999,
  },
  agentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  agentPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366f1',
    maxWidth: 80,
  },
});
