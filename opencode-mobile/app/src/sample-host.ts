import { HostHealth } from './host-types';

export const sampleHostHealth: HostHealth = {
  bridgeStatus: 'online',
  runtimeMode: 'stub',
  hostLabel: 'jakeseol-devbox',
  hostOs: 'Linux',
  lastSeenAt: new Date().toISOString(),
  version: '0.1.0-mvp',
};
