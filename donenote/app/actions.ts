'use server';

import { analyzeNote } from '@/lib/analyze';
import { getNotes, getProjects, saveNotes, saveProjects } from '@/lib/storage';
import { uid } from '@/lib/utils';
import { redirect } from 'next/navigation';

export async function createProject(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const description = String(formData.get('description') || '').trim();
  if (!name) return;

  const projects = getProjects();
  projects.unshift({
    id: uid('project'),
    name,
    description,
    createdAt: new Date().toISOString(),
  });
  saveProjects(projects);
  redirect('/dashboard');
}

export async function createAnalysis(formData: FormData) {
  const title = String(formData.get('title') || '').trim();
  const rawText = String(formData.get('rawText') || '').trim();
  let projectId = String(formData.get('projectId') || '').trim();

  if (!title || !rawText) return;

  const projects = getProjects();
  if (!projectId) {
    const fallback = projects[0];
    projectId = fallback?.id || '';
  }

  const result = analyzeNote(rawText);
  const notes = getNotes();
  const noteId = uid('note');

  notes.unshift({
    id: noteId,
    projectId,
    title,
    rawText,
    createdAt: new Date().toISOString(),
    result,
  });
  saveNotes(notes);
  redirect(`/notes/${noteId}`);
}
