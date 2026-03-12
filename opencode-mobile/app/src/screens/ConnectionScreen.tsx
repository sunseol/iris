import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  trustedHosts,
  onReconnectTrustedHost,
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
  trustedHosts: Array<{ hostId: string; label: string; endpoint: string; lastConnectedAt: string }>;
  onReconnectTrustedHost: (hostId: string) => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>OpenCode 연결</Text>
            <Text style={styles.subtitle}>OpenCode 브리지 주소, 페어링, 호스트 상태, 런타임 연결 상태를 관리합니다.</Text>
          </View>
          <SecondaryButton title="뒤로" onPress={onBack} />
        </View>
        <Text style={styles.helper}>이 화면은 일반 AI 채팅 API 연결 화면이 아니라 OpenCode 브리지 연결 화면입니다. 먼저 브리지 endpoint를 입력하고 연결한 뒤, 프로젝트/세션/런타임 흐름을 사용하세요.</Text>
      </SectionCard>

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>브리지 상태</Text>
          <Text style={styles.badge}>{formatStatus(mode)}</Text>
        </View>
        <Text style={styles.info}>{info}</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <View style={styles.actions}>
          <SecondaryButton title="호스트 새로고침" onPress={onRefreshHost} />
          <SecondaryButton title="다시 시도" onPress={onConnect} />
        </View>
      </SectionCard>

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>QR 페어링</Text>
          <View style={styles.actions}>
            <SecondaryButton title="QR 스캔" onPress={onOpenQrScanner} />
            <SecondaryButton title="QR 시뮬레이션" onPress={onSimulateQr} />
          </View>
        </View>
        <Text style={styles.helper}>기본 연결 방식은 QR 페어링입니다. 데스크톱에서 tunnel 기반 OpenCode 브리지 QR을 띄우고 모바일에서 스캔하면 endpoint와 pairing 정보가 자동 등록되고 즉시 연결을 시도합니다.</Text>
        <Label>페어링 코드</Label>
        <AppInput value={pairingCode} onChangeText={onChangePairingCode} autoCapitalize="characters" placeholder="PAIR-1234" />
        <PrimaryButton title="페어링 저장" onPress={onSavePairing} />
      </SectionCard>

      <SectionCard>
        <Label>수동 브리지 주소</Label>
        <AppInput value={endpoint} onChangeText={onChangeEndpoint} autoCapitalize="none" placeholder="wss://bridge.example.com" />
        <Text style={styles.helper}>수동 입력은 fallback/manual mode입니다. AVD에서는 ws://10.0.2.2:7345, 외부 기기에서는 tunnel로 노출된 wss:// 주소를 권장합니다.</Text>
        <PrimaryButton title={mode === 'connecting' ? '연결 중…' : '수동 연결'} onPress={onConnect} disabled={mode === 'connecting'} />
      </SectionCard>

      {(scannerOpen || scannerHint) && (
        <SectionCard>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>QR 스캐너</Text>
            <SecondaryButton title={scannerOpen ? '닫기' : '닫기'} onPress={onDismissScanner} />
          </View>
          <Text style={styles.info}>{scannerHint || 'type=opencode-bridge, endpoint, pairingToken(또는 pairingCode)이 들어 있는 QR을 스캔하세요.'}</Text>
          {scanner}
        </SectionCard>
      )}

      <SectionCard>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>호스트 상태</Text>
          <SecondaryButton title="새로고침" onPress={onRefreshHost} />
        </View>
        <View style={styles.grid}>
          <View style={styles.cell}><Text style={styles.cellLabel}>브리지</Text><Text style={styles.cellValue}>{hostHealth.bridgeStatus}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>런타임</Text><Text style={styles.cellValue}>{hostHealth.runtimeMode}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>호스트</Text><Text style={styles.cellValue}>{hostHealth.hostLabel}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>운영체제</Text><Text style={styles.cellValue}>{hostHealth.hostOs}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>버전</Text><Text style={styles.cellValue}>{hostHealth.version}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>최근 확인</Text><Text style={styles.cellValue}>{formatTime(hostHealth.lastSeenAt)}</Text></View>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>진단 정보</Text>
        <View style={styles.grid}>
          <View style={styles.cell}><Text style={styles.cellLabel}>활성 프로젝트</Text><Text style={styles.cellValue}>{diagnostics.activeProjectName}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>활성 스레드</Text><Text style={styles.cellValue}>{diagnostics.activeSessionId}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>주소</Text><Text style={styles.cellValue}>{diagnostics.endpoint}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>연결</Text><Text style={styles.cellValue}>{diagnostics.connectionState}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>모델</Text><Text style={styles.cellValue}>{diagnostics.activeModel}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>런타임</Text><Text style={styles.cellValue}>{diagnostics.runtimeStatus}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>승인 대기</Text><Text style={styles.cellValue}>{diagnostics.approvalPending}</Text></View>
          <View style={styles.cell}><Text style={styles.cellLabel}>최근 오류</Text><Text style={styles.cellValue}>{diagnostics.lastError}</Text></View>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>최근 연결</Text>
        <Text style={styles.helper}>최근에 성공적으로 연결한 브리지에 다시 연결할 수 있습니다.</Text>
        {trustedHosts.length ? trustedHosts.map((host) => (
          <TouchableOpacity key={host.hostId} style={styles.recentHostRow} onPress={() => onReconnectTrustedHost(host.hostId)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.recentHostTitle}>{host.label}</Text>
              <Text style={styles.recentHostMeta}>{host.endpoint}</Text>
              <Text style={styles.recentHostMeta}>최근 연결: {formatTime(host.lastConnectedAt)}</Text>
            </View>
            <Text style={styles.reconnectText}>재연결</Text>
          </TouchableOpacity>
        )) : <Text style={styles.helper}>최근 연결된 브리지가 아직 없습니다.</Text>}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>최근 이벤트</Text>
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
  recentHostRow: { marginTop: 10, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.panelAlt, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentHostTitle: { color: colors.text, fontWeight: '700' },
  recentHostMeta: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
  reconnectText: { color: colors.primary, fontWeight: '700' },
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
