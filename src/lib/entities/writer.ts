import { Fragment, SystemState, EntityState } from '../types';
import { randomId } from '../utils';

// Writer's grammar rules — these ARE its internal mechanism
const PRODUCTION_RULES: Record<string, string[]> = {
  'S': ['NP VP', 'NP VP PP'],
  'NP': ['DET N', 'N', 'ADJ N'],
  'VP': ['V', 'V NP'],
  'PP': ['P NP'],
  'DET': ['the', 'a', 'this', 'that'],
  'N': ['form', 'structure', 'surface', 'mark', 'edge', 'gap', 'rule', 'signal', 'trace', 'shift'],
  'ADJ': ['open', 'closed', 'partial', 'broken', 'new', 'prior', 'inner', 'outer'],
  'V': ['holds', 'breaks', 'shifts', 'meets', 'fails', 'passes', 'marks', 'reads'],
  'P': ['through', 'against', 'within', 'beyond', 'beneath'],
};

function expand(symbol: string): string {
  const rules = PRODUCTION_RULES[symbol];
  if (!rules) return symbol;
  const chosen = rules[Math.floor(Math.random() * rules.length)];
  return chosen.split(' ').map(expand).join(' ');
}

export function runWriter(state: SystemState): SystemState {
  const writer = state.entities.writer;
  const now = Date.now();
  const nextCycle = state.cycle;

  // Writer produces 1-3 fragments per cycle
  const count = 1 + Math.floor(Math.random() * 3);
  const newFragments: Fragment[] = [];

  for (let i = 0; i < count; i++) {
    const content = expand('S');
    newFragments.push({
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
        detail: `produced via S→${content}`,
      }],
      alive: true,
      marks: [],
    });
  }

  const updatedWriter: EntityState = {
    ...writer,
    cycle: nextCycle,
    internalLog: [
      ...writer.internalLog.slice(-50),
      `[${nextCycle}] produced ${count} fragments`,
    ],
    vocabulary: Object.keys(PRODUCTION_RULES),
  };

  return {
    ...state,
    document: [...state.document, ...newFragments],
    entities: { ...state.entities, writer: updatedWriter },
    log: [...state.log, {
      cycle: nextCycle,
      timestamp: now,
      entity: 'writer',
      action: `produced ${count} fragments`,
    }],
  };
}

export { PRODUCTION_RULES };
