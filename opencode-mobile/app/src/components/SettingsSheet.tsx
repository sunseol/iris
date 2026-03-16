import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { tokens } from '../theme/tokens';
import { colors } from '../theme';
import { HostHealth } from '../host-types';
import { AppInput, Label, PrimaryButton, SecondaryButton, SectionCard } from '../components';
import { formatStatus, formatTime } from '../format';

export function SettingsSheet({
  open,
  onClose,
  // Connection props
  endpoint,
  onChangeEndpoint,
  onConnect,
  onRefreshHost,
  onOpenQrScanner,
  onSimulateQr,
  onSavePairing,
  pairingCode,
  onChangePairingCode,
  mode,
  info,
  error,
  hostHealth,
  scannerOpen,
  scannerHint,
  scanner,
  onDismissScanner,
  diagnostics,
  recentEvents,
  // Models & Auth props
  onOpenModelsAuth,
  onClearCache,
}: {
  open: boolean;
  onClose: () => void;
  endpoint: string;
  onChangeEndpoint: (value: string) => void;
  onConnect: () => void;
  onRefreshHost: () => void;
  onOpenQrScanner: () => void;
  onSimulateQr: () => void;
  onSavePairing: () => void;
  pairingCode: string;
  onChangePairingCode: (value: string) => void;
  mode: 'disconnected' | 'connecting' | 'connected';
  info: string;
  error?: string | null;
  hostHealth: HostHealth;
  scannerOpen: boolean;
  scannerHint: string | null;
  scanner: React.ReactNode;
  onDismissScanner: () => void;
  diagnostics: {
    activeProjectName: string;
    activeSessionId: string;
    endpoint: string;
    connectionState: string;
    activeModel: string;
    runtimeStatus: string;
    lastError: string;
    approvalPending: string;
  };
  recentEvents: string[];
  onOpenModelsAuth: () => void;
  onClearCache?: () => void;
}) {
  const translateY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: open ? 0 : 600,
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
              <Text style={styles.title}>Settings</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color={tokens.color.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Bridge Connection Section */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>CONNECTION</Text>
              <View style={styles.sectionCard}>
                <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
                  <View style={[styles.iconWrap, { backgroundColor: '#eff6ff' }]}>
                    <Ionicons name="wifi-outline" size={20} color="#2563eb" />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>Bridge Status</Text>
                    <Text style={styles.rowMeta}>{formatStatus(mode)}</Text>
                  </View>
                  <View style={[styles.statusPill, mode === 'connected' && styles.statusPillConnected]}>
                    <View style={[styles.statusDot, { backgroundColor: mode === 'connected' ? '#22c55e' : mode === 'connecting' ? '#f59e0b' : '#ef4444' }]} />
                    <Text style={[styles.statusText, mode === 'connected' && styles.statusTextConnected]}>{formatStatus(mode)}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <View style={styles.inputSection}>
                  <Label>Bridge endpoint</Label>
                  <AppInput value={endpoint} onChangeText={onChangeEndpoint} autoCapitalize="none" placeholder="ws://host:7345" />
                  <PrimaryButton title={mode === 'connecting' ? 'Connecting\u2026' : 'Connect'} onPress={onConnect} disabled={mode === 'connecting'} />
                </View>

                <View style={styles.rowDivider} />

                {!!error && <Text style={styles.errorText}>{error}</Text>}
                <Text style={styles.infoText}>{info}</Text>
                <View style={styles.buttonRow}>
                  <SecondaryButton title="Refresh host" onPress={onRefreshHost} />
                  <SecondaryButton title="Retry" onPress={onConnect} />
                </View>
              </View>
            </View>

            {/* Pairing Section */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>PAIRING</Text>
              <View style={styles.sectionCard}>
                <TouchableOpacity style={styles.settingsRow} onPress={onOpenQrScanner} activeOpacity={0.7}>
                  <View style={[styles.iconWrap, { backgroundColor: '#faf5ff' }]}>
                    <Ionicons name="qr-code-outline" size={20} color="#7c3aed" />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>QR Scanner</Text>
                    <Text style={styles.rowMeta}>Scan pairing code</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <View style={styles.inputSection}>
                  <Label>Pairing code</Label>
                  <AppInput value={pairingCode} onChangeText={onChangePairingCode} autoCapitalize="characters" placeholder="PAIR-1234" />
                  <View style={styles.buttonRow}>
                    <PrimaryButton title="Save pairing" onPress={onSavePairing} />
                    <SecondaryButton title="Simulate QR" onPress={onSimulateQr} />
                  </View>
                </View>

                {(scannerOpen || scannerHint) && (
                  <>
                    <View style={styles.rowDivider} />
                    <View style={styles.scannerSection}>
                      <View style={styles.scannerHeader}>
                        <Text style={styles.rowTitle}>QR Scanner</Text>
                        <SecondaryButton title={scannerOpen ? 'Close' : 'Dismiss'} onPress={onDismissScanner} />
                      </View>
                      <Text style={styles.infoText}>{scannerHint || 'Scan a pairing QR code.'}</Text>
                      {scanner}
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Agent & Workspace Section */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>AGENT & WORKSPACE</Text>
              <View style={styles.sectionCard}>
                <TouchableOpacity style={styles.settingsRow} onPress={onOpenModelsAuth} activeOpacity={0.7}>
                  <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="sparkles-outline" size={20} color="#d97706" />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>Default Model</Text>
                    <Text style={styles.rowMeta}>{diagnostics.activeModel}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </TouchableOpacity>

                <View style={styles.rowDivider} />

                <TouchableOpacity style={styles.settingsRow} onPress={onOpenModelsAuth} activeOpacity={0.7}>
                  <View style={[styles.iconWrap, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="key-outline" size={20} color="#d97706" />
                  </View>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>API Keys & Auth</Text>
                    <Text style={styles.rowMeta}>Manage provider credentials</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#d1d5db" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Host Status Section */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>HOST STATUS</Text>
              <View style={styles.sectionCard}>
                <View style={styles.hostGrid}>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Bridge</Text><Text style={styles.hostValue}>{hostHealth.bridgeStatus}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Runtime</Text><Text style={styles.hostValue}>{hostHealth.runtimeMode}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Host</Text><Text style={styles.hostValue}>{hostHealth.hostLabel}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>OS</Text><Text style={styles.hostValue}>{hostHealth.hostOs}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Version</Text><Text style={styles.hostValue}>{hostHealth.version}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Last seen</Text><Text style={styles.hostValue}>{formatTime(hostHealth.lastSeenAt)}</Text></View>
                </View>
              </View>
            </View>

            {/* Diagnostics Section */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionLabel}>DIAGNOSTICS</Text>
              <View style={styles.sectionCard}>
                <View style={styles.hostGrid}>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Project</Text><Text style={styles.hostValue}>{diagnostics.activeProjectName}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Thread</Text><Text style={styles.hostValue}>{diagnostics.activeSessionId}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Endpoint</Text><Text style={styles.hostValue}>{diagnostics.endpoint}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Connection</Text><Text style={styles.hostValue}>{diagnostics.connectionState}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Model</Text><Text style={styles.hostValue}>{diagnostics.activeModel}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Runtime</Text><Text style={styles.hostValue}>{diagnostics.runtimeStatus}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Approval</Text><Text style={styles.hostValue}>{diagnostics.approvalPending}</Text></View>
                  <View style={styles.hostCell}><Text style={styles.hostLabel}>Last error</Text><Text style={styles.hostValue}>{diagnostics.lastError}</Text></View>
                </View>
                {onClearCache && (
                  <View style={{ marginTop: 10 }}>
                    <SecondaryButton title="Clear cached data" onPress={onClearCache} />
                  </View>
                )}
              </View>
            </View>

            {/* Recent Events */}
            <View style={[styles.sectionGroup, { marginBottom: 32 }]}>
              <Text style={styles.sectionLabel}>RECENT EVENTS</Text>
              <View style={styles.sectionCard}>
                {recentEvents.length ? recentEvents.map((event, index) => (
                  <Text key={`${index}:${event}`} style={styles.eventLine}>\u2022 {event}</Text>
                )) : <Text style={styles.infoText}>No recent events yet.</Text>}
              </View>
            </View>
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
    maxHeight: '88%',
    minHeight: '50%',
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
  },
  handleWrap: { alignItems: 'center', paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: '#d1d5db' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingHorizontal: 4 },
  headerCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { color: tokens.color.text, fontWeight: '700', fontSize: 22 },
  closeButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { gap: 20, paddingBottom: 24 },

  sectionGroup: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', letterSpacing: 1.2, paddingLeft: 4 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' },

  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 12, color: '#9ca3af', fontWeight: '500', marginTop: 1 },
  rowDivider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },

  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  statusPillConnected: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  statusTextConnected: { color: '#16a34a' },

  inputSection: { gap: 10 },
  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 4 },
  infoText: { color: '#9ca3af', fontSize: 13, lineHeight: 20 },

  scannerSection: { gap: 8 },
  scannerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  hostGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hostCell: { width: '47%', backgroundColor: '#f9fafb', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  hostLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  hostValue: { color: colors.text, fontWeight: '600', fontSize: 13 },

  eventLine: { color: '#6b7280', fontSize: 12, lineHeight: 20, marginTop: 4 },
});