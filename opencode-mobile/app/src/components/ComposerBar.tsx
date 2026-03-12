import React from 'react';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppInput, GhostButton, PrimaryButton, SecondaryButton } from '../components';
import { tokens } from '../theme/tokens';

export function ComposerBar({
  value,
  onChangeText,
  onSend,
  onCancel,
  onResume,
  modelLabel,
  disabled,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onResume: () => void;
  modelLabel: string;
  disabled?: boolean;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 420;

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <GhostButton title="슬래시" icon="code-slash-outline" onPress={() => onChangeText(`${value}${value ? ' ' : ''}/`)} />
        <View style={styles.attachmentStrip}>
          <View style={styles.inlineRow}><Ionicons name="attach-outline" size={14} color={tokens.color.textSoft} /><Text style={styles.attachmentLabel}>컨텍스트</Text></View>
          <Text style={styles.attachmentValue} numberOfLines={1}>첨부된 컨텍스트 없음</Text>
        </View>
        <View style={styles.modelChip}><Ionicons name="sparkles-outline" size={14} color={tokens.color.text} /><Text style={styles.modelText} numberOfLines={1}>{modelLabel}</Text></View>
      </View>
      <AppInput value={value} onChangeText={onChangeText} multiline style={styles.input} placeholder="이 스레드에서 할 작업을 적어 주세요..." />
      <View style={[styles.actionRow, compact && styles.actionRowCompact]}>
        <View style={compact ? styles.actionFull : undefined}><SecondaryButton title="이어하기" icon="play-back-outline" onPress={onResume} /></View>
        <View style={compact ? styles.actionFull : undefined}><SecondaryButton title="취소" icon="close-circle-outline" onPress={onCancel} danger /></View>
        <View style={[styles.sendWrap, compact && styles.actionFull]}><PrimaryButton title="보내기" icon="arrow-up-circle-outline" onPress={onSend} disabled={disabled} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: tokens.color.panel, borderWidth: 1, borderColor: tokens.color.borderStrong, borderRadius: tokens.radius.lg, padding: tokens.space.sm, gap: 10, paddingBottom: Platform.OS === 'ios' ? 14 : 10 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  attachmentStrip: { flex: 1, backgroundColor: tokens.color.panelAlt, borderWidth: 1, borderColor: tokens.color.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  attachmentLabel: { color: tokens.color.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  attachmentValue: { color: tokens.color.textSoft, fontSize: 12, marginTop: 2 },
  modelChip: { backgroundColor: tokens.color.primarySoft, borderWidth: 1, borderColor: tokens.color.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  modelText: { color: tokens.color.text, fontFamily: tokens.type.mono, fontSize: 12, flexShrink: 1 },
  input: { minHeight: 84, maxHeight: 160, textAlignVertical: 'top', backgroundColor: tokens.color.panelMuted, borderColor: tokens.color.borderStrong },
  actionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionRowCompact: { flexWrap: 'wrap' },
  actionFull: { width: '100%' },
  sendWrap: { flex: 1 },
});
