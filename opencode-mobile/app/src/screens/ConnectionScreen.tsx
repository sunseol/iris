import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
          <View>
            <Text style={styles.title}>Connection</Text>
            <Text style={styles.subtitle}>Bridge endpoint, pairing, reconnect, and host/runtime health.</Text>
          </View>
          <SecondaryButton title="Back" onPress={onBack} />
        </View>
        <Text style={styles.helper}>첫 실행에서는 bridge endpoint를 입력하고 Connect를 누르세요. 연결 실패 시 아래 Diagnostics와 Recent events를 함께 공유하면 문제 재현이 쉬워집니다.</Text>
      </SectionCard>

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Bridge status</Text>
          <Text style={styles.badge}>{formatStatus(mode)}</Text>
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
        <Text style={styles.helper}>테스터는 호스트에서 실행 중인 bridge 주소를 이 칸에 넣으면 됩니다. 예: ws://192.168.0.10:7345</Text>
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
        <Text style={styles.helper}>문제 보고 시 아래 최근 이벤트와 Diagnostics를 함께 전달해 주세요.</Text>
        {recentEvents.length ? recentEvents.map((event, index) => (
          <Text key={`${index}:${event}`} style={styles.eventLine}>• {event}</Text>
        )) : <Text style={styles.helper}>최근 이벤트가 아직 없습니다.</Text>}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  title: { color: colors.text, fontWeight: '700', fontSize: 22 },
  subtitle: { color: colors.textMuted, marginTop: 4, maxWidth: 420 },
  helper: { color: colors.textMuted, marginTop: 8, lineHeight: 18 },
  eventLine: { color: colors.textSoft, marginTop: 8, lineHeight: 18, fontSize: 12 },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badge: { color: colors.textSoft, backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 12 },
  info: { color: colors.textSoft, marginTop: 8, lineHeight: 20 },
  error: { color: '#fca5a5', marginTop: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  cell: { width: '48%', backgroundColor: colors.panelAlt, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border },
  cellLabel: { color: colors.textMuted, fontSize: 12, marginBottom: 4 },
  cellValue: { color: colors.text, fontWeight: '600' },
});
