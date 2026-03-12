import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ModelConfig, AuthProfile, Project } from '../types';
import { SectionCard, SecondaryButton } from '../components';
import { colors } from '../theme';

export function ModelsAuthScreen({
  project,
  authProfiles,
  modelCatalog,
  activeModelId,
  activeAuthProfileId,
  onSelectModel,
  onSelectAuthProfile,
  onToggleAuthStatus,
  onBack,
}: {
  project: Project | null;
  authProfiles: AuthProfile[];
  modelCatalog: ModelConfig[];
  activeModelId?: string | null;
  activeAuthProfileId?: string | null;
  onSelectModel: (modelId: string) => void;
  onSelectAuthProfile: (authProfileId: string) => void;
  onToggleAuthStatus: (authProfileId: string) => void;
  onBack: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Models & Auth</Text>
            <Text style={styles.subtitle}>Control the provider identity and model used by the active project.</Text>
          </View>
          <SecondaryButton title="Back" onPress={onBack} />
        </View>
        <Text style={styles.context}>Project: {project?.name || 'No project selected'}</Text>
        <Text style={styles.help}>외부 테스터는 여기서 현재 project에 연결된 모델과 인증 상태를 확인하세요. approval required 경로는 현재 환경에 따라 제한될 수 있으므로, 먼저 연결 상태와 모델 선택이 맞는지 확인하는 것이 중요합니다.</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Provider auth</Text>
        {authProfiles.map((profile) => {
          const active = profile.id === activeAuthProfileId;
          return (
            <View key={profile.id} style={[styles.card, active && styles.cardActive]}>
              <View style={styles.rowBetween}>
                <View style={styles.flexCopy}>
                  <Text style={styles.cardTitle}>{profile.label}</Text>
                  <Text style={styles.meta}>{profile.providerId} · {profile.authMethod || 'unknown'}</Text>
                  <Text style={styles.meta}>Status: {profile.status}</Text>
                </View>
                <Text style={styles.badge}>{active ? 'Active' : 'Available'}</Text>
              </View>
              <View style={styles.actions}>
                <SecondaryButton title={active ? 'Selected' : 'Use profile'} onPress={() => onSelectAuthProfile(profile.id)} />
                <SecondaryButton title={profile.status === 'connected' ? 'Logout' : 'Login'} onPress={() => onToggleAuthStatus(profile.id)} />
              </View>
            </View>
          );
        })}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Model selection</Text>
        {modelCatalog.map((model) => {
          const active = model.id === activeModelId;
          return (
            <TouchableOpacity key={model.id} activeOpacity={0.9} onPress={() => onSelectModel(model.id)}>
              <View style={[styles.card, active && styles.cardActive]}>
                <View style={styles.rowBetween}>
                  <View style={styles.flexCopy}>
                    <Text style={styles.cardTitle}>{model.label}</Text>
                    <Text style={styles.meta}>{model.providerId}</Text>
                    <Text style={styles.meta}>{model.available ? 'Available' : 'Unavailable'}{model.recommended ? ' · Recommended' : ''}</Text>
                  </View>
                  <Text style={styles.badge}>{active ? 'Active' : 'Select'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  title: { color: colors.text, fontWeight: '700', fontSize: 22 },
  subtitle: { color: colors.textMuted, marginTop: 4, maxWidth: 420 },
  context: { color: colors.textSoft, marginTop: 10 },
  help: { color: colors.textMuted, marginTop: 8, lineHeight: 18 },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  card: { backgroundColor: colors.panelAlt, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12, marginTop: 10 },
  cardActive: { borderColor: colors.primary, backgroundColor: '#101d38' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  flexCopy: { flex: 1, paddingRight: 8 },
  cardTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  badge: { color: colors.textSoft, backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
});
