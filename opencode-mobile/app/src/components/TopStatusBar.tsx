import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { tokens } from '../theme/tokens';

type Props = {
  projectName: string;
  workspacePath: string;
  executionTarget?: string;
  model: string;
  authState: string;
  connectionState: string;
  threadStatus: string;
};

export function TopStatusBar({ projectName, workspacePath, executionTarget, model, authState, connectionState, threadStatus }: Props) {
  const { width } = useWindowDimensions();
  const compact = width < 420;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <StatusItem label="PROJECT" value={projectName} grow />
        <StatusItem label="THREAD" value={threadStatus} mono />
      </View>
      <View style={styles.row}>
        <StatusItem label="PATH" value={workspacePath} mono grow />
      </View>
      <View style={styles.row}>
        <StatusItem label="MODEL" value={model} mono grow={compact} />
        <StatusItem label="TARGET" value={executionTarget || 'local'} mono />
        <StatusItem label="CONN" value={connectionState} />
        <StatusItem label="AUTH" value={authState} />
      </View>
    </View>
  );
}

function StatusItem({ label, value, mono, grow }: { label: string; value: string; mono?: boolean; grow?: boolean }) {
  return (
    <View style={[styles.item, grow && styles.itemGrow]}>
      <Text style={styles.label}>{label}</Text>
      <Text numberOfLines={1} style={[styles.value, mono && styles.mono]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: tokens.color.panel,
    borderWidth: 1,
    borderColor: tokens.color.borderStrong,
    borderRadius: tokens.radius.lg,
    padding: tokens.space.sm,
    gap: tokens.space.xs,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.xs },
  item: { minWidth: 72, flexShrink: 1 },
  itemGrow: { flex: 1, minWidth: 140 },
  label: { color: tokens.color.textMuted, fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  value: { color: tokens.color.text, fontSize: 11, marginTop: 3 },
  mono: { fontFamily: tokens.type.mono, color: tokens.color.mono },
});
