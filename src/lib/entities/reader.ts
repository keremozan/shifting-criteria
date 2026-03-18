import { Fragment, Mark, Operation, SystemState, EntityState } from '../types';
import { randomId } from '../utils';

// Pattern definitions — exported for display in UI
export const READER_PATTERNS = {
  SURVIVAL: {
    name: 'SURVIVAL',
    description: 'Fragment flagged but still alive',
    notation: (fragId: string, age: number) => `∴surv[${fragId}:${age}]`,
  },
  ECHO: {
    name: 'ECHO',
    description: 'Two living fragments share 3+ words',
    notation: (fragA: string, fragB: string, count: number) => `≈echo{${fragA}↔${fragB}}[${count}]`,
  },
  DENSITY: {
    name: 'DENSITY',
    description: 'More than 10 living fragments',
    notation: (living: number, total: number) => `∥dens[${living}/${total}]`,
  },
  VOID: {
    name: 'VOID',
    description: 'More dead fragments than alive',
    notation: (dead: number, alive: number) => `∅void[${dead}:${alive}]`,
  },
};

function hasFlagMark(frag: Fragment): boolean {
  return frag.marks.some((m) => m.type === 'flag');
}

function hasReaderComment(frag: Fragment, pattern: string): boolean {
  return frag.marks.some(
    (m) => m.entity === 'reader' && m.type === 'comment' && m.content.startsWith(pattern),
  );
}

function getSharedWordCount(a: Fragment, b: Fragment): number {
  const wordsA = new Set(a.content.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.content.toLowerCase().split(/\s+/));
  let count = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) count++;
  }
  return count;
}

function addAnnotation(
  frag: Fragment,
  notation: string,
  cycle: number,
  now: number,
): Fragment {
  const mark: Mark = {
    entity: 'reader',
    type: 'comment',
    color: '#f59e0b',
    content: notation,
    timestamp: now,
  };
  const op: Operation = {
    id: randomId(),
    entity: 'reader',
    type: 'annotate',
    timestamp: now,
    cycle,
    detail: notation,
  };
  return {
    ...frag,
    marks: [...frag.marks, mark],
    operations: [...frag.operations, op],
  };
}

export function runReader(state: SystemState): SystemState {
  const reader = state.entities.reader;
  const cycle = state.cycle;
  const now = Date.now();
  const internalLog: string[] = [];

  const allFragments = state.document;
  const living = allFragments.filter((f) => f.alive);
  const dead = allFragments.filter((f) => !f.alive);

  internalLog.push(`RD[${cycle}]:SCAN(${allFragments.length})`);

  // Track which fragment ids we annotate this cycle (avoid double-annotating)
  const annotatedThisCycle = new Set<string>();
  let document = [...state.document];
  const logEntries = [...state.log];
  let foundAny = false;

  // Helper to update a fragment in the document array
  function updateFragment(fragId: string, updater: (f: Fragment) => Fragment): void {
    document = document.map((f) => (f.id === fragId ? updater(f) : f));
  }

  // SURVIVAL: flagged but alive (annotate once per fragment)
  for (const frag of living) {
    if (annotatedThisCycle.has(frag.id)) continue;
    if (!hasFlagMark(frag)) continue;
    if (hasReaderComment(frag, '∴surv')) continue;

    const age = cycle - frag.cycle;
    const notation = READER_PATTERNS.SURVIVAL.notation(frag.id, age);
    updateFragment(frag.id, (f) => addAnnotation(f, notation, cycle, now));
    annotatedThisCycle.add(frag.id);
    internalLog.push(`RD[${cycle}]:FOUND(SURVIVAL):${frag.id}`);
    foundAny = true;
  }

  // ECHO: two living fragments share 3+ words (annotate once per pair)
  for (let i = 0; i < living.length; i++) {
    for (let j = i + 1; j < living.length; j++) {
      const a = living[i];
      const b = living[j];
      const shared = getSharedWordCount(a, b);
      if (shared < 3) continue;

      const notation = READER_PATTERNS.ECHO.notation(a.id, b.id, shared);

      if (!annotatedThisCycle.has(a.id) && !hasReaderComment(a, `≈echo{${a.id}↔${b.id}}`)) {
        updateFragment(a.id, (f) => addAnnotation(f, notation, cycle, now));
        annotatedThisCycle.add(a.id);
      }
      if (!annotatedThisCycle.has(b.id) && !hasReaderComment(b, `≈echo{${a.id}↔${b.id}}`)) {
        updateFragment(b.id, (f) => addAnnotation(f, notation, cycle, now));
        annotatedThisCycle.add(b.id);
      }

      internalLog.push(`RD[${cycle}]:FOUND(ECHO):${a.id}↔${b.id}`);
      foundAny = true;
    }
  }

  // DENSITY: more than 10 living fragments (annotate once)
  if (living.length > 10) {
    const notation = READER_PATTERNS.DENSITY.notation(living.length, allFragments.length);
    for (const frag of living) {
      if (annotatedThisCycle.has(frag.id)) continue;
      if (hasReaderComment(frag, '∥dens')) continue;
      updateFragment(frag.id, (f) => addAnnotation(f, notation, cycle, now));
      annotatedThisCycle.add(frag.id);
      break;
    }
    internalLog.push(`RD[${cycle}]:FOUND(DENSITY):${living.length}/${allFragments.length}`);
    foundAny = true;
  }

  // VOID: more removed than active (annotate once per fragment)
  if (dead.length > living.length) {
    const notation = READER_PATTERNS.VOID.notation(dead.length, living.length);
    for (const frag of living) {
      if (annotatedThisCycle.has(frag.id)) continue;
      if (hasReaderComment(frag, '∅void')) continue;
      updateFragment(frag.id, (f) => addAnnotation(f, notation, cycle, now));
      annotatedThisCycle.add(frag.id);
      break;
    }
    internalLog.push(`RD[${cycle}]:FOUND(VOID):${dead.length}:${living.length}`);
    foundAny = true;
  }

  if (!foundAny) {
    internalLog.push(`RD[${cycle}]:QUIET`);
  }

  const updatedReader: EntityState = {
    ...reader,
    cycle,
    internalLog: [
      ...reader.internalLog.slice(-50),
      ...internalLog,
    ],
  };

  logEntries.push({
    cycle,
    timestamp: now,
    entity: 'reader',
    action: foundAny
      ? `annotated ${annotatedThisCycle.size} fragments`
      : 'scanned, nothing found',
  });

  return {
    ...state,
    document,
    entities: { ...state.entities, reader: updatedReader },
    log: logEntries,
  };
}
