import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppInput, PrimaryButton, SecondaryButton } from '../components';
import { colors } from '../theme';

export function CommandComposer({
  value,
  onChangeText,
  onSend,
  onCancel,
  disabled,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Command input</Text>
        <Text style={styles.subtitle}>Send prompts to the active runtime session</Text>
      </View>
      <AppInput value={value} onChangeText={onChangeText} multiline style={styles.input} placeholder="Describe the task for OpenCode…" />
      <View style={styles.actions}>
        <View style={styles.cancelWrap}>
          <SecondaryButton title="Cancel task" onPress={onCancel} danger />
        </View>
        <View style={styles.sendWrap}>
          <PrimaryButton title="Send to session" onPress={onSend} disabled={disabled} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.panel, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 },
  header: { marginBottom: 10 },
  title: { color: colors.text, fontWeight: '700', fontSize: 16 },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  input: { minHeight: 88, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  cancelWrap: { flex: 1 },
  sendWrap: { flex: 1.4 },
});
