export function getHostInfo() {
  return {
    bridgeStatus: 'online',
    runtimeMode: process.env.OPENCODE_BRIDGE_MODE || 'stub',
    runtimeCommand: process.env.OPENCODE_CMD || 'opencode',
    runtimeArgs: [process.env.OPENCODE_ARGS || 'run --format json', process.env.OPENCODE_SESSION_ARGS || '', process.env.OPENCODE_ATTACH_URL ? `--attach ${process.env.OPENCODE_ATTACH_URL}` : '', process.env.OPENCODE_CONTINUE_LAST === '1' ? '--continue (fallback)' : '--session <runtimeSessionID> when available'].filter(Boolean).join(' '),
    hostLabel: process.env.OPENCODE_HOST_LABEL || 'local-host',
    hostOs: process.platform,
    lastSeenAt: new Date().toISOString(),
    version: '0.1.0-mvp',
  };
}
