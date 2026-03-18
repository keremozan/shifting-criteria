# Static Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert shifting-criteria from a server-side Next.js app to a static export deployed at shifting-criteria.keremozanbayraktar.com on Cloudflare Pages.

**Architecture:** All authored data (metalog, threads, highlights, diagrams, sources, changelog) becomes static JSON imported at build time. The cycle engine runs client-side in the browser with ephemeral state (each viewer starts fresh, nothing persists to server). Viewer highlights use localStorage. All server-side API routes and filesystem operations are removed.

**Tech Stack:** Next.js (static export), TypeScript, Tailwind CSS 4, Cloudflare Pages

---

### Task 1: Remove API routes and document.ts

All 6 API route directories and the server-side document persistence module must be deleted. They rely on `fs.readFileSync`/`writeFileSync` which won't work in static export.

**Files:**
- Delete: `src/app/api/cycle/route.ts`
- Delete: `src/app/api/metalog/route.ts`
- Delete: `src/app/api/threads/route.ts`
- Delete: `src/app/api/highlights/route.ts`
- Delete: `src/app/api/diagrams/route.ts`
- Delete: `src/app/api/snapshots/route.ts`
- Delete: `src/lib/document.ts`
- Delete: `src/app/metalog-preview/` (entire directory)

- [ ] **Step 1: Delete all API routes, document.ts, and metalog-preview**

```bash
rm -rf src/app/api
rm src/lib/document.ts
rm -rf src/app/metalog-preview
```

- [ ] **Step 2: Verify no imports reference deleted files**

```bash
grep -r "from.*document" src/lib/ src/app/ src/components/ --include="*.ts" --include="*.tsx" | grep -v node_modules
grep -r "/api/" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules
```

Fix any remaining imports found.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove API routes, document.ts, metalog-preview"
```

---

### Task 2: Create static data module

All JSON data files need to be importable as ES modules at build time. Create a single data barrel that imports each JSON file and re-exports typed data.

**Files:**
- Create: `src/lib/data.ts`
- Modify: `src/lib/metalog.ts` (keep as-is, already just the type)

- [ ] **Step 1: Create the static data module**

```typescript
// src/lib/data.ts
import type { MetalogEntry } from './metalog';

import metalogData from '../../data/metalog.json';
import threadsData from '../../data/metalog-threads.json';
import highlightsData from '../../data/highlights.json';
import diagramsData from '../../data/diagrams.json';
import sourcesData from '../../data/sources.json';
import snapshotsData from '../../data/snapshots.json';

export interface Thread {
  id: number;
  startEntry: number;
  endEntry: number;
  summary: string;
  subtext?: string;
  tags: string[];
}

export interface HighlightData {
  id: string;
  text: string;
  color: string;
  bg: string;
  entryId: number;
  startOffset: number;
  endOffset: number;
  comments: { id: string; text: string; timestamp: number }[];
}

export interface Diagram {
  id: number;
  title: string;
  date: string;
  time: string;
  metalogEntryId?: number;
  html: string;
}

export interface Snapshot {
  id: string;
  date: string;
  time: string;
  cycle: number;
  alive: number;
  dead: number;
  state: any;
}

export const metalog: MetalogEntry[] = metalogData as MetalogEntry[];
export const threads: Thread[] = threadsData as Thread[];
export const authorHighlights: HighlightData[] = highlightsData as HighlightData[];
export const diagrams: Diagram[] = diagramsData as Diagram[];
export const sources: string[] = sourcesData as string[];
export const snapshots: Snapshot[] = snapshotsData as Snapshot[];
```

- [ ] **Step 2: Enable JSON imports in tsconfig.json**

Add `"resolveJsonModule": true` to compilerOptions if not already present.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data.ts tsconfig.json
git commit -m "feat: create static data module for all JSON imports"
```

---

### Task 3: Make Writer client-side (remove fs dependency)

The Writer currently uses `readFileSync` to load sources. It needs to accept sources as a parameter instead.

**Files:**
- Modify: `src/lib/entities/writer.ts`
- Modify: `src/lib/engine.ts`

- [ ] **Step 1: Rewrite writer.ts to accept sources as parameter**

```typescript
// src/lib/entities/writer.ts
import { Fragment, SystemState, EntityState } from '../types';
import { randomId } from '../utils';

function pickSources(sources: string[], count: number, existing: string[]): string[] {
  if (sources.length === 0) return [];
  const unused = sources.filter((s) => !existing.includes(s));
  const pool = unused.length > 0 ? unused : sources;
  const picked: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
  }
  return picked;
}

export function runWriter(state: SystemState, sources: string[]): SystemState {
  const writer = state.entities.writer;
  const now = Date.now();
  const nextCycle = state.cycle;
  const existingContent = state.document.map((f) => f.content);
  const count = 1 + Math.floor(Math.random() * 2);
  const sentences = pickSources(sources, count, existingContent);

  const newFragments: Fragment[] = sentences.map((content) => ({
    id: randomId(),
    content,
    createdBy: 'writer',
    createdAt: now,
    cycle: nextCycle,
    operations: [{
      id: randomId(),
      entity: 'writer',
      type: 'add',
      timestamp: now,
      cycle: nextCycle,
      detail: `sourced: "${content.slice(0, 40)}..."`,
    }],
    alive: true,
    marks: [],
  }));

  const updatedWriter: EntityState = {
    ...writer,
    cycle: nextCycle,
    internalLog: [
      ...writer.internalLog.slice(-50),
      `[${nextCycle}] sourced ${newFragments.length} fragments`,
    ],
    vocabulary: [],
  };

  return {
    ...state,
    document: [...state.document, ...newFragments],
    entities: { ...state.entities, writer: updatedWriter },
    log: [...state.log, {
      cycle: nextCycle,
      timestamp: now,
      entity: 'writer',
      action: `sourced ${newFragments.length} fragments`,
    }],
  };
}
```

- [ ] **Step 2: Update engine.ts to pass sources**

```typescript
// src/lib/engine.ts
import { SystemState } from './types';
import { runWriter } from './entities/writer';
import { runChecker } from './entities/checker';
import { runCutter } from './entities/cutter';
import { runReader } from './entities/reader';
import { runNarrator } from './entities/narrator';
import { runLogger } from './entities/logger';

export function runCycle(state: SystemState, sources: string[]): SystemState {
  let next = { ...state, cycle: state.cycle + 1 };
  next = runWriter(next, sources);
  next = runChecker(next);
  next = runCutter(next);
  next = runReader(next);
  next = runNarrator(next);
  next = runLogger(next);
  return next;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/entities/writer.ts src/lib/engine.ts
git commit -m "refactor: make Writer accept sources as parameter, remove fs dependency"
```

---

### Task 4: Rewrite main page for client-side cycles

The main page currently fetches state from `/api/cycle` and sends POST/DELETE requests. It needs to run the engine locally in React state. Remove snapshot and reset buttons.

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite page.tsx**

Key changes:
- Import `runCycle` from engine and `sources` from data module
- Create blank initial state in React state (same structure as the old DELETE handler)
- `runCycle` button calls the engine function directly and updates React state
- Remove `fetchState`, `resetState`, `takeSnapshot`, the polling interval
- Remove snapshot button, reset button
- Remove snapshots from nav (snapshots page becomes read-only archive of saved snapshots)
- Keep the cycle button

The blank state factory:
```typescript
function createBlankState(): SystemState {
  return {
    cycle: 0,
    document: [],
    entities: {
      writer: { id: 'writer', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      checker: { id: 'checker', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      cutter: { id: 'cutter', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      logger: { id: 'logger', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      reader: { id: 'reader', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      narrator: { id: 'narrator', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
    },
    criteria: { current: [], history: [] },
    log: [],
    narrative: [],
  };
}
```

The cycle handler:
```typescript
const handleCycle = () => {
  setState((prev) => runCycle(prev, sources));
};
```

- [ ] **Step 2: Verify the page builds without errors**

```bash
npx next build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: client-side cycle engine, remove server dependencies from main page"
```

---

### Task 5: Rewrite metalog page for static imports

Replace `fetch('/api/metalog')` and `fetch('/api/threads')` with static imports from the data module.

**Files:**
- Modify: `src/app/metalog/page.tsx`

- [ ] **Step 1: Replace fetches with static imports**

```typescript
import { metalog as entries, threads } from '@/lib/data';
```

Remove the `useState` + `useEffect` fetch calls for entries and threads. Use the imported constants directly. Keep the page as `'use client'` because HighlightTool needs it.

- [ ] **Step 2: Commit**

```bash
git add src/app/metalog/page.tsx
git commit -m "refactor: metalog page uses static imports instead of API fetches"
```

---

### Task 6: Rewrite HighlightTool for dual-layer highlights

The highlight tool currently fetches from `/api/highlights` and POSTs new highlights. It needs two layers:
1. Author highlights (kerem's) loaded from static data, read-only, always visible
2. Viewer highlights stored in localStorage, editable

**Files:**
- Modify: `src/components/HighlightTool.tsx`

- [ ] **Step 1: Rewrite HighlightTool**

Key changes:
- Import `authorHighlights` from `@/lib/data`
- Load viewer highlights from localStorage (key: `viewer-highlights`)
- Merge both arrays for display (author + viewer)
- New highlights save to localStorage only
- Author highlights are not editable (no comment input, no delete)
- Viewer highlights get comment input as before

- [ ] **Step 2: Commit**

```bash
git add src/components/HighlightTool.tsx
git commit -m "refactor: dual-layer highlights (static author + localStorage viewer)"
```

---

### Task 7: Rewrite remaining pages for static imports

Changelog, diagrams, and snapshots pages need to use static imports instead of API fetches.

**Files:**
- Modify: `src/app/changelog/page.tsx` (already uses hardcoded ts, should be fine)
- Modify: `src/app/diagrams/page.tsx`
- Modify: `src/app/snapshots/page.tsx`

- [ ] **Step 1: Update diagrams page**

Replace `fetch('/api/diagrams')` with:
```typescript
import { diagrams } from '@/lib/data';
```

Remove useState/useEffect fetch pattern, use the constant directly.

- [ ] **Step 2: Update snapshots page**

Replace `fetch('/api/snapshots')` with:
```typescript
import { snapshots } from '@/lib/data';
```

Remove useState/useEffect fetch pattern. This page becomes a read-only archive.

- [ ] **Step 3: Verify changelog page**

Changelog already imports from `src/lib/changelog.ts` (hardcoded). Should work as-is. Verify no API calls.

- [ ] **Step 4: Commit**

```bash
git add src/app/diagrams/page.tsx src/app/snapshots/page.tsx
git commit -m "refactor: diagrams and snapshots pages use static imports"
```

---

### Task 8: Configure Next.js static export

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Enable static export**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
};

export default nextConfig;
```

- [ ] **Step 2: Build and verify**

```bash
npx next build
```

This should produce an `out/` directory with static HTML/CSS/JS. Fix any errors (common issues: `useSearchParams` without Suspense, dynamic routes without `generateStaticParams`).

- [ ] **Step 3: Test locally**

```bash
npx serve out -p 3456
```

Open http://localhost:3456 and verify:
- Cycle button works (client-side)
- Metalog loads with threads and author highlights
- Diagrams page loads
- Snapshots page loads
- Changelog page loads
- Viewer can add highlights (localStorage)

- [ ] **Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: configure Next.js static export"
```

---

### Task 9: Deploy to Cloudflare Pages

**Files:**
- No code changes, deployment configuration only

- [ ] **Step 1: Add .gitignore entry for out/**

```bash
echo "out/" >> .gitignore
```

- [ ] **Step 2: Push to GitHub**

Create a new repo `keremozan/shifting-criteria` (or similar) and push.

```bash
git remote add origin git@github.com:keremozan/shifting-criteria.git
git push -u origin main
```

- [ ] **Step 3: Set up Cloudflare Pages project**

In Cloudflare dashboard:
- Create new Pages project
- Connect to the GitHub repo
- Build settings:
  - Build command: `npm run build`
  - Build output directory: `out`
  - Node version: match `.node-version` or use 20+
- Custom domain: `shifting-criteria.keremozanbayraktar.com`

- [ ] **Step 4: Add DNS record**

In Cloudflare DNS for `keremozanbayraktar.com`:
- Add CNAME record: `shifting-criteria` -> `shifting-criteria.pages.dev`

- [ ] **Step 5: Verify deployment**

Visit `https://shifting-criteria.keremozanbayraktar.com` and test all pages.

- [ ] **Step 6: Commit .gitignore**

```bash
git add .gitignore
git commit -m "chore: add out/ to gitignore, prepare for Cloudflare Pages"
```

---

### Task 10: Add work entry to portfolio site

**Files:**
- Create: `portfolio-site/src/content/works/shifting-criteria.md` (or link from existing works page)

- [ ] **Step 1: Add work entry or link**

This depends on kerem's preference for how it appears in the portfolio. At minimum, add a link from the works page to `shifting-criteria.keremozanbayraktar.com`.

- [ ] **Step 2: Commit and deploy portfolio**

```bash
cd ~/Projects/portfolio-site
git add -A
git commit -m "feat: add shifting-criteria work entry"
git push
```
