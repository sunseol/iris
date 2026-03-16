import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppInput, Label, PrimaryButton, SecondaryButton, SectionCard } from '../components';
import { HostHealth } from '../host-types';
import { colors } from '../theme';
import { formatStatus, formatTime } from '../format';

export function ConnectionScreen({
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
  onBack,
}: {
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
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Connection</Text>
            <Text style={styles.subtitle}>Bridge endpoint, pairing, and host health.</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Bridge status</Text>
          <View style={[styles.statusPill, mode === 'connected' && styles.statusPillConnected]}>
            <View style={[styles.statusDot, { backgroundColor: mode === 'connected' ? '#22c55e' : mode === 'connecting' ? '#f59e0b' : '#ef4444' }]} />
            <Text style={[styles.statusLabel, mode === 'connected' && styles.statusLabelConnected]}>{formatStatus(mode)}</Text>
          </View>
        </View>
        <Text style={styles.info}>{info}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <SecondaryButton title="Refresh host" onPress={onRefreshHost} />
          <SecondaryButton title="Retry" onPress={onConnect} />
        </View>
      </SectionCard>

      <SectionCard>
        <Label>Bridge endpoint</Label>
        <AppInput value={endpoint} onChangeText={onChangeEndpoint} autoCapitalize="none" placeholder="ws://host:7345" />
        <PrimaryButton title={mode === 'connecting' ? 'Connecting…' : 'Connect'} onPress={onConnect} disabled={mode === 'connecting'} />
      </SectionCard>

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Pairing</Text>
          <View style={styles.actions}>
            <SecondaryButton title="Open QR" onPress={onOpenQrScanner} />
            <SecondaryButton title="Simulate QR" onPress={onSimulateQr} />
          </View>
        </View>
        <Label>Pairing code</Label>
        <AppInput value={pairingCode} onChangeText={onChangePairingCode} autoCapitalize="characters" placeholder="PAIR-1234" />
        <PrimaryButton title="Save pairing" onPress={onSavePairing} />
      </SectionCard>

      {(scannerOpen || scannerHint) && (
        <SectionCard>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>QR scanner</Text>
            <SecondaryButton title={scannerOpen ? 'Close' : 'Dismiss'} onPress={onDismissScanner} />
          </View>
          <Text style={styles.info}>{scannerHint || 'Scan a pairing QR code containing endpoint and pairingCode.'}</Text>
          {scanner}
        </SectionCard>
      )}

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Host status</Text>
          <SecondaryButton title="Refresh" onPress={onRefreshHost} />
        </View>
        <View style={styles.grid}>
          <View style={styles.cell}><Text style={styles.cellLabel}>Bridge</Text><Text style={styles.cellValue}>{hostHealth.bridgeStatus}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Runtime</Text><Text style={styles.cellValue}>{hostHealth.runtimeMode}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Host</Text><Text style={styles.cellValue}>{hostHealth.hostLabel}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>OS</Text><Text style={styles.cellValue}>{hostHealth.hostOs}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Version</Text><Text style={styles.cellValue}>{hostHealth.version}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Last seen</Text><Text style={styles.cellValue}>{formatTime(hostHealth.lastSeenAt)}</Text></View>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Diagnostics</Text>
        <View style={styles.grid}>
          <View style={styles.cell}><Text style={styles.cellLabel}>Active project</Text><Text style={styles.cellValue}>{diagnostics.activeProjectName}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Active thread</Text><Text style={styles.cellValue}>{diagnostics.activeSessionId}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Endpoint</Text><Text style={styles.cellValue}>{diagnostics.endpoint}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Connection</Text><Text style={styles.cellValue}>{diagnostics.connectionState}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Model</Text><Text style={styles.cellValue}>{diagnostics.activeModel}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Runtime</Text><Text style={styles.cellValue}>{diagnostics.runtimeStatus}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Approval pending</Text><Text style={styles.cellValue}>{diagnostics.approvalPending}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>Last error</Text><Text style={styles.cellValue}>{diagnostics.lastError}</Text></View>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Recent events</Text>
        {recentEvents.length ? recentEvents.map((event, index) => (
          <Text key={`${index}:${event}`} style={styles.eventLine}>• {event}</Text>
        )) : <Text style={styles.helper}>No recent events yet.</Text>}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  backButton: { padding: 8, borderRadius: 999, backgroundColor: '#f3f4f6' },
  title: { color: colors.text, fontWeight: '700', fontSize: 22 },
  subtitle: { color: colors.textMuted, marginTop: 4, maxWidth: 420 },
  helper: { color: colors.textMuted, marginTop: 8, lineHeight: 18 },
  eventLine: { color: colors.textSoft, marginTop: 8, lineHeight: 18, fontSize: 12 },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb' },
  statusPillConnected: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: '600', color: colors.textSoft },
  statusLabelConnected: { color: '#16a34a' },
  info: { color: colors.textSoft, marginTop: 8, lineHeight: 20 },
  error: { color: '#dc2626', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  cell: { width: '48%', backgroundColor: '#f9fafb', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cellLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  cellValue: { color: colors.text, fontWeight: '600' },
});
