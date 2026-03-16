import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from './theme';

export function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({ title, onPress, disabled, icon }: { title: string; onPress: () => void; disabled?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <TouchableOpacity style={[styles.primaryButton, disabled && styles.disabled]} onPress={onPress} disabled={disabled} accessibilityRole="button">
      {icon ? <Ionicons name={icon} size={16} color="white" style={styles.buttonIcon} /> : null}
      <Text style={styles.primaryButtonText}>{title}</Text>
    </TouchableOpacity>
  );
}

export function SecondaryButton({ title, onPress, danger, icon }: { title: string; onPress: () => void; danger?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <TouchableOpacity style={[styles.secondaryButton, danger && styles.dangerButton]} onPress={onPress} accessibilityRole="button">
      {icon ? <Ionicons name={icon} size={15} color={danger ? '#dc2626' : colors.textSoft} style={styles.buttonIcon} /> : null}
      <Text style={[styles.secondaryButtonText, danger && styles.dangerButtonText]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function GhostButton({ title, onPress, active, icon }: { title: string; onPress: () => void; active?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <TouchableOpacity style={[styles.ghostButton, active && styles.ghostButtonActive]} onPress={onPress} accessibilityRole="button">
      {icon ? <Ionicons name={icon} size={15} color={active ? colors.primary : colors.textMuted} style={styles.buttonIcon} /> : null}
      <Text style={[styles.ghostButtonText, active && styles.ghostButtonTextActive]}>{title}</Text>
    </TouchableOpacity>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function AppInput(props: React.ComponentProps<typeof TextInput>) {
  return <TextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.panel, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border },
  primaryButton: { marginTop: 10, backgroundColor: '#000000', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  primaryButtonText: { color: 'white', fontWeight: '700' },
  secondaryButton: { backgroundColor: colors.panelAlt, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  dangerButton: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  secondaryButtonText: { color: colors.text, fontWeight: '600' },
  dangerButtonText: { color: '#dc2626' },
  ghostButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.panelAlt, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 6 },
  ghostButtonActive: { borderColor: colors.primary, backgroundColor: '#eff6ff' },
  ghostButtonText: { color: colors.textMuted, fontWeight: '600' },
  ghostButtonTextActive: { color: colors.primary },
  buttonIcon: { marginRight: 2 },
  disabled: { opacity: 0.5 },
  label: { color: colors.textSoft, marginBottom: 8, fontSize: 13 },
  input: { backgroundColor: colors.panelAlt, color: colors.text, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.border },
});
