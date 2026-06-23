import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const scriptArgs = process.argv.slice(2);

if (scriptArgs.length === 0) {
  console.error('Usage: node scripts/run-python.mjs <script> [args...]');
  process.exit(1);
}

const candidates = [
  process.env.PYTHON,
  'python',
  'py',
  path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', 'python.exe'),
].filter(Boolean);

for (const candidate of candidates) {
  if (candidate.endsWith('.exe') && !existsSync(candidate)) {
    continue;
  }

  const result = spawnSync(candidate, scriptArgs, { stdio: 'inherit', shell: false });

  if (result.error) {
    continue;
  }

  process.exit(result.status ?? 0);
}

console.error('No usable Python interpreter found. Tried: ' + candidates.join(', '));
process.exit(1);
