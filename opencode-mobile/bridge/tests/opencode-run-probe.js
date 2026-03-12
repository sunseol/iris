import { spawn } from 'node:child_process';

const prompt = process.argv.slice(2).join(' ') || 'Say hello in one short sentence.';
const proc = spawn('opencode', ['run', '--format', 'json', prompt], {
  cwd: process.cwd(),
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';
proc.stdout.setEncoding('utf8');
proc.stderr.setEncoding('utf8');
proc.stdout.on('data', (chunk) => (stdout += chunk));
proc.stderr.on('data', (chunk) => (stderr += chunk));
proc.on('exit', (code, signal) => {
  console.log(JSON.stringify({ code, signal, stdout, stderr }, null, 2));
});
