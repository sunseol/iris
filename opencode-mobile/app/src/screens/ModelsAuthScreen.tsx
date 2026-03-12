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
            <Text style={styles.title}>모델 및 제공자 인증</Text>
            <Text style={styles.subtitle}>OpenCode 프로젝트가 사용할 제공자 인증, 실행 모델, 브리지 연동 대상을 관리합니다.</Text>
          </View>
          <SecondaryButton title="뒤로" onPress={onBack} />
        </View>
        <Text style={styles.context}>프로젝트: {project?.name || '선택된 프로젝트 없음'}</Text>
        <Text style={styles.help}>이 화면은 OpenCode 워크스페이스가 사용할 제공자와 인증 상태를 관리하는 곳입니다. OpenAI 전용 설정이 아니라, 프로젝트별로 어떤 모델/제공자를 연결할지 고르는 관리 화면입니다.</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>제공자 / 브리지 인증</Text>
        {authProfiles.map((profile) => {
          const active = profile.id === activeAuthProfileId;
          return (
            <View key={profile.id} style={[styles.card, active && styles.cardActive]}>
              <View style={styles.rowBetween}>
                <View style={styles.flexCopy}>
                  <Text style={styles.cardTitle}>{profile.label}</Text>
                  <Text style={styles.meta}>제공자: {profile.providerId} · 방식: {profile.authMethod || '알 수 없음'}</Text>
                  <Text style={styles.meta}>상태: {profile.status}</Text>
                </View>
                <Text style={styles.badge}>{active ? '사용 중' : '사용 가능'}</Text>
              </View>
              <View style={styles.actions}>
                <SecondaryButton title={active ? '선택됨' : '이 프로필 사용'} onPress={() => onSelectAuthProfile(profile.id)} />
                <SecondaryButton title={profile.status === 'connected' ? '로그아웃' : '로그인'} onPress={() => onToggleAuthStatus(profile.id)} />
              </View>
            </View>
          );
        })}
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>실행 모델 선택</Text>
        {modelCatalog.map((model) => {
          const active = model.id === activeModelId;
          return (
            <TouchableOpacity key={model.id} activeOpacity={0.9} onPress={() => onSelectModel(model.id)}>
              <View style={[styles.card, active && styles.cardActive]}>
                <View style={styles.rowBetween}>
                  <View style={styles.flexCopy}>
                    <Text style={styles.cardTitle}>{model.label}</Text>
                    <Text style={styles.meta}>제공자: {model.providerId}</Text>
                    <Text style={styles.meta}>{model.available ? '사용 가능' : '사용 불가'}{model.recommended ? ' · 추천' : ''}</Text>
                  </View>
                  <Text style={styles.badge}>{active ? '사용 중' : '선택'}</Text>
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
