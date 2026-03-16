import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const isRunning = false; // Will be driven by parent state in future

  const handleTextChange = (text: string) => {
    onChangeText(text);
    if (text.endsWith('/')) {
      setShowSlashMenu(true);
    } else if (!text.includes('/')) {
      setShowSlashMenu(false);
    }
  };

  const insertSlashCommand = (cmd: string) => {
    const beforeSlash = value.lastIndexOf('/');
    const prefix = beforeSlash >= 0 ? value.slice(0, beforeSlash) : value;
    onChangeText(`${prefix}/${cmd} `);
    setShowSlashMenu(false);
  };

  return (
    <View style={styles.wrap}>
      {showSlashMenu && (
        <View style={styles.slashMenu}>
          {['compact', 'plan', 'help', 'clear'].map((cmd) => (
            <TouchableOpacity key={cmd} style={styles.slashItem} onPress={() => insertSlashCommand(cmd)}>
              <Text style={styles.slashItemText}>/{cmd}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <View style={styles.composerRow}>
        <TouchableOpacity style={styles.threadButton} onPress={onResume} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={24} color={tokens.color.textMuted} />
          <View style={styles.unreadDot} />
        </TouchableOpacity>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={handleTextChange}
            placeholder="Message agent..."
            placeholderTextColor={tokens.color.textMuted}
            multiline
            blurOnSubmit
            onSubmitEditing={() => { if (value.trim() && !disabled) onSend(); }}
            returnKeyType="send"
            editable
          />
          <TouchableOpacity
            style={[styles.sendButton, (!value.trim() || disabled) && styles.sendButtonDisabled]}
            onPress={onSend}
            disabled={!value.trim() || disabled}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.expandButton} activeOpacity={0.7}>
          <Ionicons name="expand-outline" size={24} color={tokens.color.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  slashMenu: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  slashItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  slashItemText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: tokens.color.text,
    fontWeight: '500',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  threadButton: {
    padding: 14,
    borderRadius: 20,
    position: 'relative',
    marginBottom: 2,
  },
  unreadDot: {
    position: 'absolute',
    top: 10,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 28,
    minHeight: 56,
    paddingLeft: 4,
    paddingRight: 4,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: tokens.color.text,
    maxHeight: 128,
    minHeight: 56,
    fontWeight: '500',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    marginRight: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.5,
  },
  expandButton: {
    padding: 14,
    borderRadius: 20,
    marginBottom: 2,
  },
});
