import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
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
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Projects</Text>
            <Text style={styles.subtitle}>Project namespace controls active sessions and workspace scope.</Text>
          </View>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </SectionCard>

      <SectionCard>
        <Text style={styles.sectionTitle}>Create project</Text>
        <AppInput value={name} onChangeText={setName} placeholder="Project name" />
        <AppInput value={workspacePath} onChangeText={setWorkspacePath} placeholder="Workspace path" style={styles.inputGap} autoCapitalize="none" />
        <PrimaryButton
          title="Create project"
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
        <Text style={styles.sectionTitle}>Project list</Text>
        {projects.map((project) => {
          const active = project.id === activeProjectId;
          return (
            <TouchableOpacity key={project.id} activeOpacity={0.7} onPress={() => onSelectProject(project.id)}>
              <View style={[styles.projectCard, active && styles.projectCardActive]}>
                <View style={styles.rowBetween}>
                  <View style={styles.projectIconWrap}>
                    <Ionicons name="folder-outline" size={18} color={active ? '#2563eb' : colors.textMuted} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.projectName}>{project.name}</Text>
                    <Text style={styles.projectMeta}>{project.workspacePath}</Text>
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
  sectionTitle: { color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 10 },
  inputGap: { marginTop: 10 },
  projectCard: { marginTop: 10, backgroundColor: '#f9fafb', borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', padding: 14 },
  projectCardActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  projectIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' },
  projectName: { color: colors.text, fontWeight: '600', fontSize: 15 },
  projectMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
});
