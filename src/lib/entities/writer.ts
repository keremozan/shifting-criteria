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
