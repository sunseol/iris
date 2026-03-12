export type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

export type ActionItem = {
  text: string;
  owner?: string;
  deadline?: string;
  priority?: 'low' | 'medium' | 'high';
};

export type AnalysisResult = {
  summary: string;
  actionItems: ActionItem[];
  followUpQuestions: string[];
};

export type NoteRecord = {
  id: string;
  projectId: string;
  title: string;
  rawText: string;
  createdAt: string;
  result: AnalysisResult;
};
