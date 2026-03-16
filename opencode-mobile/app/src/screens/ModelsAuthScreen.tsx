import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Models & Auth</Text>
            <Text style={styles.subtitle}>Control the provider identity and model used by the active project.</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.context}>Project: {project?.name || 'No project selected'}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Provider auth</Text>
        {authProfiles.map((profile) => {
          const active = profile.id === activeAuthProfileId;
          return (
            <View key={profile.id} style={[styles.card, active && styles.cardActive]}>
              <View style={styles.rowBetween}>
                <View style={styles.profileIconWrap}>
                  <Ionicons name="key-outline" size={16} color={active ? '#2563eb' : colors.textMuted} />
                </View>
                <View style={styles.flexCopy}>
                  <Text style={styles.cardTitle}>{profile.label}</Text>
                  <Text style={styles.meta}>{profile.providerId} · {profile.authMethod || 'unknown'}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: profile.status === 'connected' ? '#22c55e' : '#ef4444' }]} />
                    <Text style={styles.meta}>{profile.status}</Text>
                  </View>
                </View>
                <Text style={[styles.badge, active && styles.badgeActive]}>{active ? 'Active' : 'Available'}</Text>
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
            <TouchableOpacity key={model.id} activeOpacity={0.7} onPress={() => onSelectModel(model.id)}>
              <View style={[styles.card, active && styles.cardActive]}>
                <View style={styles.rowBetween}>
                  <View style={styles.profileIconWrap}>
                    <Ionicons name="sparkles-outline" size={16} color={active ? '#2563eb' : colors.textMuted} />
                  </View>
                  <View style={styles.flexCopy}>
                    <Text style={styles.cardTitle}>{model.label}</Text>
                    <Text style={styles.meta}>{model.providerId}{model.recommended ? ' · Recommended' : ''}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
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
  container: { gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  backButton: { padding: 8, borderRadius: 999, backgroundColor: '#f3f4f6' },
  title: { color: colors.text, fontWeight: '700', fontSize: 22 },
  subtitle: { color: colors.textMuted, marginTop: 4, maxWidth: 420 },
  context: { color: colors.textSoft, marginTop: 10 },
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 8 },
  card: { backgroundColor: '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', padding: 14, marginTop: 10 },
  cardActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  flexCopy: { flex: 1, paddingRight: 8 },
  cardTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  badge: { color: colors.textMuted, backgroundColor: '#f3f4f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 11, fontWeight: '600' },
  badgeActive: { color: '#2563eb', backgroundColor: '#dbeafe' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
});
