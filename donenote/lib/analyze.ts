import { AnalysisResult } from './types';

function extractLines(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function analyzeNote(rawText: string): AnalysisResult {
  const lines = extractLines(rawText);
  const summary = lines.slice(0, 3).join(' ').slice(0, 260) || 'No meaningful summary generated.';

  const actionSource = lines.filter((line) => /todo|action|follow up|next|해야|할 일|담당|by\s/i.test(line));
  const actionItems = (actionSource.length ? actionSource : lines.slice(0, 3)).slice(0, 5).map((line, index) => ({
    text: line,
    priority: index === 0 ? 'high' : 'medium' as const,
  }));

  const followUpQuestions = [
    'Who owns each action item?',
    'What is the nearest deadline?',
    'What should be decided in the next discussion?',
  ];

  return {
    summary,
    actionItems,
    followUpQuestions,
  };
}
