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
        title: '호스트에 연결하기',
        detail: 'OpenCode 호스트 머신에서 열어 둔 브리지 WebSocket 주소를 입력하세요.',
      };
    case 'pairing':
      return {
        title: '페어링 정보 저장',
        detail: '나중에 QR 또는 릴레이 온보딩과 같은 흐름에서도 재사용할 수 있도록 지금 페어링 코드를 저장하세요.',
      };
    case 'session':
    default:
      return {
        title: '세션 열기',
        detail: '새 세션을 만들거나 최근 세션을 다시 열어 휴대폰에서 작업을 이어가세요.',
      };
  }
}
