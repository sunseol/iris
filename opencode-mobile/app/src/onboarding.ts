export type OnboardingStep = 'endpoint' | 'pairing' | 'session';

export function getNextOnboardingStep(input: {
  endpoint?: string | null;
  pairingCode?: string | null;
  activeSessionId?: string | null;
}): OnboardingStep {
  if (!input.endpoint) return 'endpoint';
  if (!input.pairingCode) return 'pairing';
  return input.activeSessionId ? 'session' : 'session';
}

export function getOnboardingCopy(step: OnboardingStep) {
  switch (step) {
    case 'endpoint':
      return {
        title: 'Connect to your host',
        detail: 'Enter the bridge WebSocket endpoint exposed by your OpenCode host machine.',
      };
    case 'pairing':
      return {
        title: 'Save pairing info',
        detail: 'Store a pairing code now so QR or relay onboarding can plug into the same flow later.',
      };
    case 'session':
    default:
      return {
        title: 'Open a session',
        detail: 'Create a new session or resume a recent one to continue work from your phone.',
      };
  }
}
