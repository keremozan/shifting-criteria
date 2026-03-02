import { SystemState, EntityState, Mark, Operation, Fragment } from '../types';
import { randomId } from '../utils';

// Adjective list shared with writer's grammar
const ADJECTIVES = ['open', 'closed', 'partial', 'broken', 'new', 'prior', 'inner', 'outer'];

// Checker's criteria — pattern-matching rules with shifting thresholds
export const CHECKER_CRITERIA: Record<string, {
  description: string;
  threshold: number;
  markType: Mark['type'];
  check: (fragment: Fragment, allLiving: Fragment[], threshold: number) => boolean;
}> = {
  wordCount: {
    description: 'flags fragments exceeding word count threshold',
    threshold: 6,
    markType: 'flag',
    check: (frag, _all, threshold) =>
      frag.content.split(/\s+/).filter(Boolean).length > threshold,
  },
  repetition: {
    description: 'highlights fragments sharing words with another living fragment',
    threshold: 2,
    markType: 'highlight',
    check: (frag, allLiving, threshold) => {
      const words = new Set(frag.content.toLowerCase().split(/\s+/));
      return allLiving.some(other => {
        if (other.id === frag.id) return false;
        const otherWords = other.content.toLowerCase().split(/\s+/);
        let shared = 0;
        for (const w of otherWords) {
          if (words.has(w)) shared++;
        }
        return shared >= threshold;
      });
    },
  },
  hasAdjective: {
    description: 'value-tags fragments containing adjectives',
    threshold: 1,
    markType: 'value-tag',
    check: (frag, _all, threshold) => {
      const words = frag.content.toLowerCase().split(/\s+/);
      let count = 0;
      for (const w of words) {
        if (ADJECTIVES.includes(w)) count++;
      }
      return count >= threshold;
    },
  },
};

function shiftCriteria(cycle: number, log: string[]): string[] {
  const names = Object.keys(CHECKER_CRITERIA);
  const target = names[cycle % names.length];
  const criterion = CHECKER_CRITERIA[target];
  const oldVal = criterion.threshold;

  // Shift by +1 or -1, but keep threshold >= 1
  const direction = Math.random() < 0.5 ? -1 : 1;
  const newVal = Math.max(1, oldVal + direction);
  criterion.threshold = newVal;

  log.push(`SHIFT[${cycle}]:${target}:${oldVal}→${newVal}`);
  return [`${target} threshold: ${oldVal}→${newVal}`];
}

export function runChecker(state: SystemState): SystemState {
  const checker = state.entities.checker;
  const now = Date.now();
  const cycle = state.cycle;
  const newLog: string[] = [];
  const criteriaShifts: string[] = [];

  // Every 5 cycles, shift a criterion
  if (cycle > 0 && cycle % 5 === 0) {
    const shifts = shiftCriteria(cycle, newLog);
    criteriaShifts.push(...shifts);
  }

  const livingFragments = state.document.filter(f => f.alive);

  // Check each living fragment that hasn't been checked this cycle
  const updatedDocument = state.document.map(frag => {
    if (!frag.alive) return frag;

    // Skip if already checked this cycle by checker
    const alreadyChecked = frag.operations.some(
      op => op.entity === 'checker' && op.cycle === cycle
    );
    if (alreadyChecked) return frag;

    const newMarks: Mark[] = [];
    const newOps: Operation[] = [];
    const criteriaNames = Object.keys(CHECKER_CRITERIA);

    for (const name of criteriaNames) {
      const criterion = CHECKER_CRITERIA[name];
      const passed = criterion.check(frag, livingFragments, criterion.threshold);

      if (passed) {
        newMarks.push({
          entity: 'checker',
          type: criterion.markType,
          color: '#3b82f6',
          content: `${name}: matched (threshold: ${criterion.threshold})`,
          timestamp: now,
        });

        newLog.push(`CHK[${cycle}]:${frag.id}:FAIL(${name})`);
      } else {
        newLog.push(`CHK[${cycle}]:${frag.id}:PASS(${name})`);
      }
    }

    newOps.push({
      id: randomId(),
      entity: 'checker',
      type: 'value',
      timestamp: now,
      cycle,
      detail: `checked against ${criteriaNames.length} criteria`,
    });

    return {
      ...frag,
      marks: [...frag.marks, ...newMarks],
      operations: [...frag.operations, ...newOps],
    };
  });

  const checkedCount = livingFragments.filter(f =>
    !f.operations.some(op => op.entity === 'checker' && op.cycle === cycle)
  ).length;

  const updatedChecker: EntityState = {
    ...checker,
    cycle,
    internalLog: [
      ...checker.internalLog.slice(-50),
      ...newLog,
    ],
    rules: {
      ...checker.rules,
      criteriaThresholds: Object.fromEntries(
        Object.entries(CHECKER_CRITERIA).map(([k, v]) => [k, v.threshold])
      ),
    },
  };

  const logEntries = [
    ...state.log,
    {
      cycle,
      timestamp: now,
      entity: 'checker' as const,
      action: `checked ${checkedCount} fragments${criteriaShifts.length ? '; shifted: ' + criteriaShifts.join(', ') : ''}`,
    },
  ];

  // Record criteria shift in system criteria history
  let criteria = state.criteria;
  if (criteriaShifts.length > 0) {
    criteria = {
      current: Object.keys(CHECKER_CRITERIA),
      history: [
        ...criteria.history,
        { criteria: criteriaShifts, cycle },
      ],
    };
  }

  return {
    ...state,
    document: updatedDocument,
    entities: { ...state.entities, checker: updatedChecker },
    criteria,
    log: logEntries,
  };
}
