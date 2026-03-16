import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';

interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  preview: string;
  status: 'pending' | 'applied' | 'rejected';
}

export function DiffReviewSheet({
  open,
  onClose,
  files,
  onApply,
  onReject,
}: {
  open: boolean;
  onClose: () => void;
  files: DiffFile[];
  onApply: (index: number) => void;
  onReject: (index: number) => void;
}) {
  const translateY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: open ? 0 : 500,
      useNativeDriver: true,
      damping: 22,
      stiffness: 180,
      mass: 0.9,
    }).start();
  }, [open, translateY]);

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 8 && gesture.dy > 0,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) translateY.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 110 || gesture.vy > 1.1) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            damping: 22,
            stiffness: 180,
            mass: 0.9,
          }).start();
        }
      },
    }),
    [onClose, translateY],
  );

  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View style={styles.handleWrap} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Changed Files</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statAdd}>+{totalAdditions}</Text>
                <Text style={styles.statDel}>-{totalDeletions}</Text>
                <Text style={styles.fileCount}>{files.length} file{files.length === 1 ? '' : 's'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={tokens.color.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {files.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={32} color={tokens.color.textMuted} />
                <Text style={styles.emptyTitle}>No changed files</Text>
                <Text style={styles.emptyText}>File changes will appear here when the agent modifies code.</Text>
              </View>
            ) : (
              files.map((file, index) => (
                <View key={`${index}:${file.path}`} style={styles.fileCard}>
                  <View style={styles.fileHeader}>
                    <View style={styles.fileIconWrap}>
                      <Ionicons name="code-slash-outline" size={16} color={tokens.color.textMuted} />
                    </View>
                    <View style={styles.fileCopy}>
                      <Text style={styles.filePath} numberOfLines={1}>{file.path}</Text>
                      <View style={styles.fileStats}>
                        <Text style={styles.fileStatAdd}>+{file.additions}</Text>
                        <Text style={styles.fileStatDel}>-{file.deletions}</Text>
                        <Text style={styles.fileStatus}>{file.status}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.preview} numberOfLines={8}>{file.preview}</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity style={styles.rejectButton} onPress={() => onReject(index)} activeOpacity={0.7}>
                      <Ionicons name="close" size={16} color="#dc2626" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.applyButton} onPress={() => onApply(index)} activeOpacity={0.7}>
                      <Ionicons name="checkmark" size={16} color="#ffffff" />
                      <Text style={styles.applyText}>Apply</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: {
    maxHeight: '80%',
    minHeight: '36%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  handleWrap: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: '#d1d5db' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, paddingHorizontal: 4 },
  headerCopy: { flex: 1, gap: 6 },
  title: { color: tokens.color.text, fontWeight: '700', fontSize: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statAdd: { fontSize: 12, fontWeight: '700', color: '#16a34a', backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  statDel: { fontSize: 12, fontWeight: '700', color: '#dc2626', backgroundColor: '#fef2f2', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  fileCount: { fontSize: 12, color: tokens.color.textMuted, fontWeight: '500' },
  closeButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { gap: 12, paddingBottom: 24 },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { color: tokens.color.text, fontWeight: '600', fontSize: 16 },
  emptyText: { color: tokens.color.textMuted, textAlign: 'center', lineHeight: 20, maxWidth: 260 },

  fileCard: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 20, padding: 14, gap: 10 },
  fileHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' },
  fileCopy: { flex: 1, gap: 4 },
  filePath: { color: tokens.color.text, fontFamily: tokens.type.mono, fontSize: 13 },
  fileStats: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fileStatAdd: { fontSize: 11, fontWeight: '600', color: '#16a34a', backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  fileStatDel: { fontSize: 11, fontWeight: '600', color: '#dc2626', backgroundColor: '#fef2f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, overflow: 'hidden' },
  fileStatus: { fontSize: 11, fontWeight: '600', color: tokens.color.textMuted, textTransform: 'uppercase' },
  preview: { color: tokens.color.textSoft, fontFamily: tokens.type.mono, fontSize: 12, lineHeight: 18, backgroundColor: '#f9fafb', borderRadius: 12, padding: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  rejectButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  rejectText: { color: '#dc2626', fontWeight: '600' },
  applyButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#000000' },
  applyText: { color: '#ffffff', fontWeight: '600' },
});