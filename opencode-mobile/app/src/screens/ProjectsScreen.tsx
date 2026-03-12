import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppInput, PrimaryButton, SecondaryButton, SectionCard } from '../components';
import { Project } from '../types';
import { colors } from '../theme';

export function ProjectsScreen({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onBack,
}: {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (input: { name: string; workspacePath: string }) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState('');
  const [workspacePath, setWorkspacePath] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SectionCard>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>프로젝트</Text>
            <Text style={styles.subtitle}>프로젝트는 활성 세션과 워크스페이스 범위를 결정합니다.</Text>
          </View>
          <SecondaryButton title="뒤로" onPress={onBack} />
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>프로젝트 만들기</Text>
        <AppInput value={name} onChangeText={setName} placeholder="프로젝트 이름" />
        <AppInput value={workspacePath} onChangeText={setWorkspacePath} placeholder="워크스페이스 경로" style={styles.inputGap} autoCapitalize="none" />
        <PrimaryButton
          title="프로젝트 만들기"
          onPress={() => {
            const nextName = name.trim();
            const nextPath = workspacePath.trim();
            if (!nextName || !nextPath) return;
            onCreateProject({ name: nextName, workspacePath: nextPath });
            setName('');
            setWorkspacePath('');
          }}
          disabled={!name.trim() || !workspacePath.trim()}
        />
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>프로젝트 목록</Text>
        {projects.map((project) => {
          const active = project.id === activeProjectId;
          return (
            <TouchableOpacity key={project.id} activeOpacity={0.9} onPress={() => onSelectProject(project.id)}>
              <View style={[styles.projectCard, active && styles.projectCardActive]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.badge}>{active ? '사용 중' : '선택'}</Text>
                </View>
                <Text style={styles.projectMeta}>{project.workspacePath}</Text>
                <Text style={styles.projectMeta}>기본 모델: {project.defaultModelId || '미지정'}</Text>
                <Text style={styles.projectMeta}>인증 프로필: {project.authProfileId || '설정되지 않음'}</Text>
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
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 10 },
  inputGap: { marginTop: 10 },
  projectCard: { marginTop: 10, backgroundColor: colors.panelAlt, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 12 },
  projectCardActive: { borderColor: colors.primary, backgroundColor: '#101d38' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  projectName: { color: colors.text, fontWeight: '700', fontSize: 15 },
  badge: { color: colors.textSoft, backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', fontSize: 12 },
  projectMeta: { color: colors.textMuted, fontSize: 12, marginTop: 5 },
});
