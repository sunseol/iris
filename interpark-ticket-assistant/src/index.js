#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { setTimeout: sleep } = require('timers/promises');

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DEFAULT_CONFIG_PATH = path.resolve(process.cwd(), 'config.json');

const DEFAULT_CONFIG = {
  targetUrl: 'https://mobileticket.interpark.com/goods/26002204',
  pollIntervalMs: 15000,
  targetSaleDateTimeKst: null,
  openBrowserSecondsBefore: 120,
  autoRefreshCountdown: null,
  copyUrlToClipboard: false,
  requestTimeoutMs: 15000,
  stopOnAvailable: true,
  requestUserAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
  availability: {
    availableText: ['예매하기', '예매', 'buy', 'ticket'],
    unavailableText: ['오픈 전', '판매 예정', '준비중', '매진'],
    availableTitleText: ['예매', '모바일티켓'],
    unavailableTitleText: ['오픈 전', '준비중'],
  },
};

main().catch((error) => {
  console.error(`[${formatKstTimestamp()}] [error] ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));

  if (options.help || command === 'help') {
    printUsage();
    return;
  }

  const config = loadConfig(options.configPath);
  applyOptionOverrides(config, options);

  if (command === 'monitor') {
    await runMonitor(config, options);
    return;
  }

  if (command === 'launch') {
    await runLaunch(config, options);
    return;
  }

  printUsage();
}

function parseArgs(argv) {
  const options = {};
  let command = 'monitor';

  if (argv.length && !argv[0].startsWith('-')) {
    command = argv[0];
    argv = argv.slice(1);
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
      continue;
    }
    if (arg === '--config' || arg === '-c') {
      options.configPath = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg === '--once') {
      options.once = true;
      continue;
    }
    if (arg === '--copy') {
      options.copy = true;
      continue;
    }
    if (arg === '--copy=false' || arg === '--no-copy') {
      options.copy = false;
      continue;
    }
    if (arg === '--interval') {
      options.pollIntervalMs = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }
    throw new Error(`알 수 없는 옵션: ${arg}`);
  }

  return { command, options };
}

function applyOptionOverrides(config, options) {
  if (Number.isFinite(options.pollIntervalMs) && options.pollIntervalMs > 0) {
    config.pollIntervalMs = options.pollIntervalMs;
  }
  if (typeof options.copy === 'boolean') {
    config.copyUrlToClipboard = options.copy;
  }
}

function loadConfig(configPath) {
  const resolvedPath = configPath ? path.resolve(configPath) : DEFAULT_CONFIG_PATH;

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `설정 파일을 찾을 수 없습니다: ${resolvedPath}. config.sample.json을 복사해 config.json을 만든 뒤 실행하세요.`
    );
  }

  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);
  const config = mergeConfig(parsed);
  validateConfig(config);
  return config;
}

function mergeConfig(parsed) {
  return {
    ...DEFAULT_CONFIG,
    ...parsed,
    availability: {
      ...DEFAULT_CONFIG.availability,
      ...(parsed.availability || {}),
    },
  };
}

function validateConfig(config) {
  if (!config.targetUrl) {
    throw new Error('targetUrl이 비어 있습니다.');
  }
  if (!config.targetSaleDateTimeKst) {
    throw new Error('targetSaleDateTimeKst가 비어 있습니다.');
  }
  parseKstDateTime(config.targetSaleDateTimeKst);
}

function parseKstDateTime(value) {
  const valueText = String(value).trim();
  if (!valueText) {
    throw new Error('비어 있는 날짜입니다.');
  }
  if (/([+-]\d{2}:\d{2})$/.test(valueText)) {
    const parsed = new Date(valueText);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`targetSaleDateTimeKst 형식 오류: ${valueText}`);
    }
    return parsed;
  }
  const match = valueText.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/
  );
  if (!match) {
    throw new Error(
      `targetSaleDateTimeKst 형식 오류(예: 2026-03-01T19:00:00+09:00): ${valueText}`
    );
  }
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6] || '0');
  return new Date(Date.UTC(year, month, day, hour, minute, second) - KST_OFFSET_MS);
}

function formatKstTimestamp(date = new Date()) {
  const kst = toKst(date).toISOString().replace('T', ' ').replace('.000Z', '+09:00');
  return kst;
}

function toKst(date) {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000 + KST_OFFSET_MS);
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}분`);
  parts.push(`${seconds}초`);
  return parts.join(' ');
}

function cleanText(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!match) {
    return '';
  }
  return cleanText(match[1]).slice(0, 120);
}

function normalizePatterns(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function findHit(source, patterns) {
  for (const pattern of patterns) {
    if (source.includes(pattern)) {
      return pattern;
    }
  }
  return '';
}

function evaluateAvailability(html, title, availabilityConfig) {
  const body = cleanText(html).toLowerCase();
  const titleText = title.toLowerCase();
  const availablePatterns = normalizePatterns(availabilityConfig.availableText);
  const unavailablePatterns = normalizePatterns(availabilityConfig.unavailableText);
  const availableTitlePatterns = normalizePatterns(availabilityConfig.availableTitleText);
  const unavailableTitlePatterns = normalizePatterns(availabilityConfig.unavailableTitleText);

  const availableBodyHit = findHit(body, availablePatterns);
  const unavailableBodyHit = findHit(body, unavailablePatterns);
  const availableTitleHit = findHit(titleText, availableTitlePatterns);
  const unavailableTitleHit = findHit(titleText, unavailableTitlePatterns);

  const hasAvailableSignal =
    Boolean(availableBodyHit || availableTitleHit) &&
    !unavailableBodyHit &&
    !unavailableTitleHit;
  const hasUnavailableSignal =
    Boolean(unavailableBodyHit || unavailableTitleHit) &&
    !(availableBodyHit || availableTitleHit);

  const status = hasAvailableSignal
    ? 'available'
    : hasUnavailableSignal
    ? 'closed'
    : 'unknown';

  return {
    status,
    availableBodyHit,
    unavailableBodyHit,
    availableTitleHit,
    unavailableTitleHit,
  };
}

async function fetchPage(config) {
  const controller = new AbortController();
  const timeout = Number.isFinite(config.requestTimeoutMs) ? config.requestTimeoutMs : 15000;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(config.targetUrl, {
      headers: {
        'User-Agent': config.requestUserAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      html: body,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function checkOnce(config) {
  const started = Date.now();
  try {
    const response = await fetchPage(config);
    const title = extractTitle(response.html);
    const evalResult = evaluateAvailability(response.html, title, config.availability);
    return {
      ok: true,
      statusCode: response.status,
      durationMs: Date.now() - started,
      title,
      ...evalResult,
    };
  } catch (error) {
    return {
      ok: false,
      durationMs: Date.now() - started,
      error: error.message,
    };
  }
}

function logLine(message) {
  console.log(`[${formatKstTimestamp()}] ${message}`);
}

async function waitForOpenTime(openAt) {
  if (openAt.getTime() <= Date.now()) {
    return;
  }
  while (Date.now() < openAt.getTime()) {
    const remain = openAt.getTime() - Date.now();
    logLine(`[launch] 브라우저 오픈 대기 중 (${formatDuration(remain)} 남음)`);
    await sleep(1000);
  }
}

async function runMonitor(config, options) {
  const saleTime = parseKstDateTime(config.targetSaleDateTimeKst);
  const interval = Math.max(1000, Number(config.pollIntervalMs) || 1000);
  let lastLog = '';

  logLine(
    `[monitor] 대상: ${config.targetUrl}, 폴링: ${interval}ms, 오픈 예정: ${formatKstTimestamp(saleTime)}`
  );

  while (true) {
    const now = new Date();
    const remain = saleTime.getTime() - now.getTime();
    const remainText = remain > 0 ? `${formatDuration(remain)} 후 오픈 예정` : '오픈 시간 도달';
    const result = await checkOnce(config);

    let message;
    if (!result.ok) {
      message = `[monitor] ${remainText} | 네트워크 오류: ${result.error}`;
    } else {
      const status = result.status;
      const title = result.title || '(title 없음)';
      message = `[monitor] ${remainText} | HTTP ${result.statusCode} | 상태=${status} | latency=${result.durationMs}ms | title="${title}"`;
      if (result.availableBodyHit || result.unavailableBodyHit || result.availableTitleHit || result.unavailableTitleHit) {
        message += ` | signals=${[
          result.availableBodyHit,
          result.unavailableBodyHit,
          result.availableTitleHit,
          result.unavailableTitleHit,
        ]
          .filter(Boolean)
          .join(',') || 'none'}`;
      }
    }

    if (message !== lastLog) {
      logLine(message);
      lastLog = message;
    } else {
      logLine(`${message} (중복)`);
    }

    if (result.ok && result.status === 'available' && config.stopOnAvailable) {
      logLine('[monitor] 예매 가능 신호 감지. 모니터링을 종료합니다.');
      return;
    }

    if (options.once) {
      return;
    }

    await sleep(interval);
  }
}

async function runLaunch(config, options) {
  const saleTime = parseKstDateTime(config.targetSaleDateTimeKst);
  const openAt = new Date(saleTime.getTime() - Number(config.openBrowserSecondsBefore || 0) * 1000);
  const countdown = Number(config.autoRefreshCountdown || 0);

  logLine(`[launch] 대상: ${config.targetUrl}`);
  logLine(
    `[launch] 예정 오픈 시각(KST): ${formatKstTimestamp(
      saleTime
    )}, 오픈 ${config.openBrowserSecondsBefore}초 전에 브라우저 실행`
  );

  await waitForOpenTime(openAt);
  await openInBrowser(config.targetUrl);
  logLine('[launch] 기본 브라우저를 열었습니다.');

  if (config.copyUrlToClipboard || options.copy) {
    try {
      await copyToClipboard(config.targetUrl);
      logLine('[launch] URL을 클립보드에 복사했습니다.');
    } catch (error) {
      logLine(`[launch] 클립보드 복사 실패: ${error.message}`);
    }
  }

  if (countdown > 0) {
    logLine(`[launch] auto-refresh countdown 모드 활성화: ${countdown}초 간격`);
    while (true) {
      const remain = saleTime.getTime() - Date.now();
      const result = await checkOnce(config);
      if (!result.ok) {
        logLine(`[launch] 네트워크 오류: ${result.error}`);
      } else {
        const remainLabel = remain > 0 ? `${formatDuration(remain)} 남음` : '오픈 시간 도달';
        logLine(
          `[launch] ${remainLabel} | HTTP ${result.statusCode} | 상태=${result.status} | title="${result.title || '(title 없음)'}"`
        );
        if (result.status === 'available') {
          logLine('[launch] 예매 가능 신호를 감지했습니다. 브라우저에서 새로고침 후 구매를 진행하세요.');
          break;
        }
      }
      await sleep(countdown * 1000);
    }
  }
}

function openInBrowser(url) {
  const platform = process.platform;
  let command;
  let args;

  if (platform === 'darwin') {
    command = 'open';
    args = [url];
  } else if (platform === 'win32') {
    command = 'cmd';
    args = ['/c', 'start', '', url];
  } else {
    command = 'xdg-open';
    args = [url];
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { detached: true, stdio: 'ignore' });
    proc.once('error', reject);
    proc.once('spawn', () => {
      proc.unref();
      resolve();
    });
  });
}

function copyToClipboard(text) {
  const candidates = getClipboardCommands();
  return (async () => {
    for (const [command, args] of candidates) {
      const result = await runClipboardCommand(command, args, text);
      if (result) {
        return;
      }
    }
    throw new Error(
      '클립보드 명령을 찾지 못했습니다. pbcopy/clip/xclip/wl-copy 중 하나가 필요합니다.'
    );
  })();
}

function runClipboardCommand(command, args, text) {
  return new Promise((resolve) => {
    const proc = spawn(command, args, { stdio: ['pipe', 'ignore', 'ignore'] });
    proc.on('error', () => resolve(false));
    proc.stdin.write(text);
    proc.stdin.end();
    proc.on('close', (code) => {
      resolve(code === 0);
    });
  });
}

function getClipboardCommands() {
  if (process.platform === 'darwin') {
    return [['pbcopy', []]];
  }
  if (process.platform === 'win32') {
    return [['clip', []]];
  }
  return [
    ['xclip', ['-selection', 'clipboard']],
    ['wl-copy', []],
    ['xsel', ['--clipboard', '--input']],
  ];
}

function printUsage() {
  console.log(`사용법:
  node src/index.js monitor [--config config.json] [--once] [--interval 밀리초]
  node src/index.js launch [--config config.json] [--copy|--no-copy]
  node src/index.js --help

옵션:
  --help, -h              사용법 출력
  --config, -c PATH        설정 파일 경로 (기본: config.json)
  --once                   monitor 모드에서 한 번만 실행 후 종료
  --interval 숫자          monitor 폴링 주기(ms) 오버라이드
  --copy                   launch 모드에서 URL을 클립보드로 복사
  --no-copy                launch 모드에서 클립보드 복사 비활성화`);
}
