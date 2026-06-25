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
  'python3',
  'py',
  path.join(process.env.USERPROFILE || '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'python', 'python.exe'),
].filter(Boolean);

let lastStatus = 1;
let tried = 0;

for (const candidate of candidates) {
  if (candidate.endsWith('.exe') && !existsSync(candidate)) {
    continue;
  }

  const probe = spawnSync(candidate, ['-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'], { stdio: 'ignore', shell: false });
  if (probe.error || probe.status !== 0) {
    continue;
  }

  tried += 1;
  const result = spawnSync(candidate, scriptArgs, { stdio: 'inherit', shell: false });

  if (result.error) {
    continue;
  }

  if ((result.status ?? 1) === 0) {
    process.exit(0);
  }

  lastStatus = result.status ?? 1;
}

if (tried === 0) {
  console.error('No usable Python 3.10+ interpreter found. Tried: ' + candidates.join(', '));
}
process.exit(lastStatus);
