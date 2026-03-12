export type HostHealth = {
  bridgeStatus: 'offline' | 'connecting' | 'online';
  runtimeMode: 'stub' | 'process' | 'unknown' | string;
  runtimeCommand?: string;
  runtimeArgs?: string;
  hostLabel: string;
  hostOs: string;
  lastSeenAt: string;
  version: string;
};
