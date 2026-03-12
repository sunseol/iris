export function formatStatus(status: string) {
  return status.replace(/^[a-z]/, (m) => m.toUpperCase());
}

export function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatRisk(risk?: string) {
  if (!risk) return 'Normal';
  return risk.replace(/^[a-z]/, (m) => m.toUpperCase());
}

export function formatRuntimeSessionID(value?: string | null) {
  if (!value) return 'Not assigned';
  return value.length > 16 ? `${value.slice(0, 16)}…` : value;
}
