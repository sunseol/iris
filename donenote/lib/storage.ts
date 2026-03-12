import fs from 'fs';
import path from 'path';
import { NoteRecord, Project } from './types';

const dataDir = path.join(process.cwd(), 'data');
const projectsFile = path.join(dataDir, 'projects.json');
const notesFile = path.join(dataDir, 'notes.json');

function ensureFile(filePath: string, fallback: unknown) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
}

export function getProjects(): Project[] {
  ensureFile(projectsFile, []);
  return JSON.parse(fs.readFileSync(projectsFile, 'utf8')) as Project[];
}

export function saveProjects(projects: Project[]) {
  ensureFile(projectsFile, []);
  fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
}

export function getNotes(): NoteRecord[] {
  ensureFile(notesFile, []);
  return JSON.parse(fs.readFileSync(notesFile, 'utf8')) as NoteRecord[];
}

export function saveNotes(notes: NoteRecord[]) {
  ensureFile(notesFile, []);
  fs.writeFileSync(notesFile, JSON.stringify(notes, null, 2));
}
