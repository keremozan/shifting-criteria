import { Fragment, SystemState, EntityState } from '../types';
import { randomId } from '../utils';

// Cutter's rules config — exposed for display
export const CUTTER_RULES = {
  killOldUnmarked: {
    name: 'kill_old_unmarked',
    description: 'Fragments older than 3 cycles with zero marks are cut',
    ageCycles: 3,
    maxMarks: 0,
  },
  killFlagged: {
    name: 'kill_flagged',
    description: 'Fragments with 2+ flag marks are cut',
    minFlags: 2,
  },
  killLong: {
    name: 'kill_long',
    description: 'Fragments with more than 8 words are cut',
    maxWords: 8,
  },
  maxKillsPerCycle: 2,
};

interface CutCandidate {
  fragment: Fragment;
  rule: string;
  reason: string;
  flagCount: number;
  age: number;
}

function countFlags(frag: Fragment): number {
  return frag.marks.filter(m => m.type === 'flag').length;
}

function wordCount(content: string): number {
  return content.trim().split(/\s+/).length;
}

function findCandidates(document: Fragment[], cycle: number): CutCandidate[] {
  const candidates: CutCandidate[] = [];

  for (const frag of document) {
    if (!frag.alive) continue;

    const age = cycle - frag.cycle;
    const flags = countFlags(frag);
    const words = wordCount(frag.content);

    // Rule 1: old unmarked
    if (age > CUTTER_RULES.killOldUnmarked.ageCycles && frag.marks.length === 0) {
      candidates.push({
        fragment: frag,
        rule: 'kill_old_unmarked',
        reason: `age=${age},marks=0`,
        flagCount: flags,
        age,
      });
      continue; // one rule per fragment, worst offender logic handles priority
    }

    // Rule 2: flagged
    if (flags >= CUTTER_RULES.killFlagged.minFlags) {
      candidates.push({
        fragment: frag,
        rule: 'kill_flagged',
        reason: `flags=${flags}`,
        flagCount: flags,
        age,
      });
      continue;
    }

    // Rule 3: long
    if (words > CUTTER_RULES.killLong.maxWords) {
      candidates.push({
        fragment: frag,
        rule: 'kill_long',
        reason: `words=${words}`,
        flagCount: flags,
        age,
      });
    }
  }

  return candidates;
}

function sortByWorst(candidates: CutCandidate[]): CutCandidate[] {
  return [...candidates].sort((a, b) => {
    // Most flags first
    if (b.flagCount !== a.flagCount) return b.flagCount - a.flagCount;
    // Then oldest first
    return b.age - a.age;
  });
}

export function runCutter(state: SystemState): SystemState {
  const cutter = state.entities.cutter;
  const now = Date.now();
  const cycle = state.cycle;

  const candidates = findCandidates(state.document, cycle);

  // No targets
  if (candidates.length === 0) {
    const idleLog = `IDLE[${cycle}]:NO_TARGETS`;
    return {
      ...state,
      entities: {
        ...state.entities,
        cutter: {
          ...cutter,
          cycle,
          internalLog: [...cutter.internalLog.slice(-50), idleLog],
        },
      },
      log: [...state.log, {
        cycle,
        timestamp: now,
        entity: 'cutter',
        action: 'no targets found',
      }],
    };
  }

  const sorted = sortByWorst(candidates);
  const toKill = sorted.slice(0, CUTTER_RULES.maxKillsPerCycle);
  const spared = sorted.slice(CUTTER_RULES.maxKillsPerCycle);

  const internalLog: string[] = [];
  const killedIds = new Set(toKill.map(c => c.fragment.id));

  // Log kills
  for (const c of toKill) {
    internalLog.push(`CUT[${cycle}]:${c.fragment.id}:REASON(${c.rule})`);
  }

  // Log spares
  for (const c of spared) {
    internalLog.push(`SKIP[${cycle}]:${c.fragment.id}:SPARED(max_reached)`);
  }

  // Apply cuts to document
  const updatedDocument = state.document.map(frag => {
    if (!killedIds.has(frag.id)) return frag;

    const candidate = toKill.find(c => c.fragment.id === frag.id)!;

    return {
      ...frag,
      alive: false,
      operations: [...frag.operations, {
        id: randomId(),
        entity: 'cutter' as const,
        type: 'remove' as const,
        timestamp: now,
        cycle,
        detail: `CUT[${cycle}]:${frag.id}:REASON(${candidate.rule})`,
      }],
      marks: [...frag.marks, {
        entity: 'cutter' as const,
        type: 'flag' as const,
        color: '#ef4444',
        content: candidate.reason,
        timestamp: now,
      }],
    };
  });

  const updatedCutter: EntityState = {
    ...cutter,
    cycle,
    internalLog: [
      ...cutter.internalLog.slice(-50),
      ...internalLog,
    ],
  };

  return {
    ...state,
    document: updatedDocument,
    entities: { ...state.entities, cutter: updatedCutter },
    log: [...state.log, {
      cycle,
      timestamp: now,
      entity: 'cutter',
      action: `cut ${toKill.length}, spared ${spared.length}`,
    }],
  };
}
