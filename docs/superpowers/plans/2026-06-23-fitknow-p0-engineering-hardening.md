# FitKnow P0 Engineering Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the P0 engineering hardening work for FitKnow Web so the app has one clear entrypoint, portable data scripts, aligned React/TypeScript versions, and reliable verification commands.

**Architecture:** Keep the current Vite + React app structure intact and avoid large feature refactors in this phase. Limit changes to entrypoint cleanup, dependency/script hardening, documentation updates, and a verification pass that creates a safe baseline for the later TypeScript and route-splitting phases described in `doc/plan.md`.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind CSS 4, Python data scripts, npm

---

## File Map

- Modify: `package.json`
  Responsibility: normalize npm scripts and dependency versions used by the current app.
- Modify: `package-lock.json`
  Responsibility: lock the dependency updates after `npm install`.
- Modify: `README.md`
  Responsibility: document the portable Python-based data workflow and verification commands.
- Modify: `.gitignore`
  Responsibility: keep runtime logs out of Git if coverage is incomplete.
- Delete: `src/main.jsx`
  Responsibility: remove the unused legacy entrypoint once references are confirmed absent.
- Delete: `devserver.err.log`
- Delete: `devserver.out.log`
- Delete: `static.err.log`
- Delete: `static.out.log`
- Delete: `vite.err.log`
- Delete: `vite.out.log`
  Responsibility: remove historical runtime artifacts from the repository root.
- Verify only: `index.html`
  Responsibility: confirm the app points at `src/main.tsx`.
- Verify only: `src/main.tsx`
  Responsibility: confirm this remains the only runtime entrypoint.
- Verify only: `src/App.tsx`
  Responsibility: note that `// @ts-nocheck` remains deferred to the P1 plan.

## Current State Notes

- `index.html` already points to `/src/main.tsx`.
- `src/main.jsx` still exists and contains the legacy app implementation.
- `src/App.tsx` is still large and begins with `// @ts-nocheck`; this plan does not remove it yet.
- `package.json` currently pins `react` and `react-dom` to 18 while `@types/react`, `@types/react-dom`, and `typescript` are on newer incompatible majors.
- `package.json` currently hardcodes a user-specific Python runtime path for `extract` and `verify:data`.
- Root log files currently exist and `.gitignore` already includes `*.log`.

### Task 1: Confirm the single-entrypoint baseline

**Files:**
- Verify: `index.html`
- Verify: `src/main.tsx`
- Verify: `src/main.jsx`

- [ ] **Step 1: Confirm the runtime entrypoint in HTML**

Check that `index.html` contains this exact script tag:

```html
<script type="module" src="/src/main.tsx"></script>
```

- [ ] **Step 2: Search for live references to the legacy file**

Run:

```powershell
rg -n "main\.jsx" .
```

Expected:
- The only meaningful hit is the file itself or planning/docs references.
- No Vite config, HTML, npm script, or source import should depend on `src/main.jsx`.

- [ ] **Step 3: Confirm the current TypeScript entrypoint stays minimal**

`src/main.tsx` should stay focused on mounting the app and wrapping it with the error boundary:

```tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles.css';
```

- [ ] **Step 4: Record the acceptance gate for deletion**

Only delete `src/main.jsx` after Steps 1-3 succeed. If `rg` shows a live runtime dependency, stop and resolve that reference before deleting the file.

### Task 2: Remove the legacy entrypoint and historical log files

**Files:**
- Delete: `src/main.jsx`
- Delete: `devserver.err.log`
- Delete: `devserver.out.log`
- Delete: `static.err.log`
- Delete: `static.out.log`
- Delete: `vite.err.log`
- Delete: `vite.out.log`

- [ ] **Step 1: Delete the unused legacy entrypoint**

Remove:

```text
src/main.jsx
```

Reason:
- The app already boots from `src/main.tsx`.
- Keeping a full duplicate implementation increases maintenance noise and future refactor risk.

- [ ] **Step 2: Delete root-level runtime logs**

Remove these files:

```text
devserver.err.log
devserver.out.log
static.err.log
static.out.log
vite.err.log
vite.out.log
```

- [ ] **Step 3: Re-run the legacy-reference search**

Run:

```powershell
rg -n "main\.jsx" .
```

Expected:
- No runtime references remain.
- Only plan or documentation references are acceptable.

### Task 3: Align React type packages and TypeScript version

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Update `package.json` dependency versions**

Change the `devDependencies` block to align React 18 with its type packages and move TypeScript back to a stable 5.x release:

```json
"devDependencies": {
  "@tailwindcss/vite": "^4.3.1",
  "@types/react": "^18.3.18",
  "@types/react-dom": "^18.3.5",
  "tailwindcss": "^4.3.1",
  "typescript": "^5.8.3",
  "vite-plugin-pwa": "^1.3.0"
}
```

- [ ] **Step 2: Keep runtime React packages unchanged in this phase**

Do not change this block during P0:

```json
"dependencies": {
  "@vitejs/plugin-react": "^4.3.4",
  "html-to-image": "^1.11.13",
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "vite": "^6.0.7"
}
```

- [ ] **Step 3: Refresh the lockfile**

Run:

```powershell
npm install
```

Expected:
- `package-lock.json` updates cleanly.
- No major-resolution surprises for React or TypeScript.

### Task 4: Make Python-based data scripts portable

**Files:**
- Modify: `package.json`
- Modify: `README.md`

- [ ] **Step 1: Replace user-specific Python paths in npm scripts**

Update the scripts block from hardcoded absolute paths to portable commands:

```json
"scripts": {
  "extract": "python scripts/extract_workbook.py",
  "verify:data": "python scripts/verify_data.py",
  "dev": "vite",
  "dev:5174": "vite --host 127.0.0.1 --port 5174 --strictPort",
  "typecheck": "tsc --noEmit",
  "build": "vite build",
  "preview": "vite preview --host 127.0.0.1"
}
```

- [ ] **Step 2: Only add Windows-specific fallback scripts if `python` is unavailable**

Optional fallback, only if the verification machine needs it:

```json
"extract:win": "py scripts/extract_workbook.py",
"verify:data:win": "py scripts/verify_data.py"
```

Do not add these preemptively unless the environment proves that plain `python` fails.

- [ ] **Step 3: Update README setup instructions**

Add or revise a short section that explicitly states:

```md
## Development Requirements

- Node.js 18+ or 20+
- npm
- Python 3.10+ available on PATH as `python`
```

And keep these commands documented:

```bash
npm install
npm run extract
npm run verify:data
npm run typecheck
npm run build
```

### Task 5: Confirm log-ignore coverage

**Files:**
- Verify: `.gitignore`

- [ ] **Step 1: Confirm `.gitignore` covers runtime logs**

Ensure `.gitignore` keeps this line:

```gitignore
*.log
```

- [ ] **Step 2: Avoid unnecessary edits if coverage is already correct**

If `.gitignore` already contains `*.log`, do not change the file just to restate the same rule.

### Task 6: Run the full P0 verification pass

**Files:**
- Verify: `package.json`
- Verify: `package-lock.json`
- Verify: generated JSON files under `src/data/generated/`

- [ ] **Step 1: Run data verification**

Run:

```powershell
npm run verify:data
```

Expected:
- The Python validation script completes without missing generated JSON or asset failures.

- [ ] **Step 2: Run type checking**

Run:

```powershell
npm run typecheck
```

Expected:
- TypeScript completes successfully with the existing `src/App.tsx` constraints still in place.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected:
- Vite produces a successful production build without depending on `src/main.jsx`.

- [ ] **Step 4: Review the final Git diff**

Run:

```powershell
git status --short
```

Expected changed scope:
- `package.json`
- `package-lock.json`
- `README.md`
- `src/main.jsx` deleted
- root log files deleted
- `.gitignore` only if coverage needed adjustment

### Task 7: Commit the P0 baseline

**Files:**
- Commit only the P0 hardening scope from Tasks 1-6

- [ ] **Step 1: Stage only the intended files**

Run:

```powershell
git add package.json package-lock.json README.md src/main.jsx .gitignore devserver.err.log devserver.out.log static.err.log static.out.log vite.err.log vite.out.log
```

If `.gitignore` was unchanged, omit it from the command.

- [ ] **Step 2: Create a focused commit**

Run:

```powershell
git commit -m "chore: harden fitknow web P0 baseline"
```

- [ ] **Step 3: Stop before P1**

Do not start `src/App.tsx` type migration, business-function extraction, or route splitting in the same change unless the P0 verification pass is already green and explicitly approved for continuation.

## Phase Boundary After This Plan

When P0 is complete, the next implementation plan should start with P1 from `doc/plan.md`:

1. add minimum route/state typings in `src/App.tsx`
2. remove `// @ts-nocheck`
3. extract pure calculation helpers into focused modules
4. add light tests around those extracted functions

## Self-Review

- Spec coverage: this plan covers the P0 items from `doc/plan.md` that are still outstanding in the repository today: single entrypoint cleanup, log cleanup, dependency alignment, portable Python scripts, and verification.
- Placeholder scan: no `TODO` or deferred implementation placeholders are left inside the executable tasks; optional Windows fallback scripts are explicitly guarded behind a verification condition.
- Type consistency: the plan consistently treats `src/main.tsx` as the sole entrypoint, keeps React runtime on 18.x, moves React type packages to 18.x, and moves TypeScript to 5.8.x.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-23-fitknow-p0-engineering-hardening.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
