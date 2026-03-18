import { SystemState, EntityState, Fragment } from '../types';
import { fmtRun } from '../taxonomy';

function countByPredicate(frags: Fragment[], pred: (f: Fragment) => boolean): number {
  return frags.filter(pred).length;
}

function writerSentence(state: SystemState): string | null {
  const newFrags = state.document.filter(
    (f) => f.cycle === state.cycle && f.operations.some((op) => op.entity === 'writer' && op.type === 'add')
  );
  if (newFrags.length === 0) return null;
  const contents = newFrags.map((f) => `"${f.content}"`);
  if (newFrags.length === 1) return `Writer sourced ${contents[0]}.`;
  return `Writer sourced ${newFrags.length} fragments: ${contents.join(', ')}.`;
}

function checkerSentence(state: SystemState): string | null {
  const active = state.document.filter((f) => f.alive);
  const flagged: string[] = [];
  const highlighted: string[] = [];
  const tagged: string[] = [];

  for (const frag of active) {
    const thisCheckerMarks = frag.marks.filter(
      (m) => m.entity === 'checker' && frag.operations.some((op) => op.entity === 'checker' && op.cycle === state.cycle)
    );
    for (const m of thisCheckerMarks) {
      const short = frag.content.split(' ').slice(0, 4).join(' ');
      if (m.type === 'flag') flagged.push(short);
      if (m.type === 'highlight') highlighted.push(short);
      if (m.type === 'value-tag') tagged.push(short);
    }
  }

  const parts: string[] = [];
  if (flagged.length > 0) parts.push(`flagged ${flagged.length} for length`);
  if (highlighted.length > 0) parts.push(`highlighted ${highlighted.length} for repetition`);
  if (tagged.length > 0) parts.push(`tagged ${tagged.length} with adjectives`);

  if (parts.length === 0) {
    const checked = active.filter((f) =>
      f.operations.some((op) => op.entity === 'checker' && op.cycle === state.cycle)
    ).length;
    if (checked > 0) return `Checker evaluated ${checked} fragments. All passed.`;
    return null;
  }
  return `Checker ${parts.join(', ')}.`;
}

function cutterSentence(state: SystemState): string | null {
  const removed = state.document.filter(
    (f) => !f.alive && f.operations.some((op) => op.entity === 'cutter' && op.type === 'remove' && op.cycle === state.cycle)
  );
  if (removed.length === 0) return 'Cutter found nothing to remove.';
  const reasons = removed.map((f) => {
    const op = f.operations.find((o) => o.entity === 'cutter' && o.type === 'remove' && o.cycle === state.cycle);
    const match = op?.detail.match(/REASON\((\w+)\)/);
    const reason = match?.[1] || 'unknown';
    const short = f.content.split(' ').slice(0, 4).join(' ');
    if (reason === 'kill_old_unmarked') return `"${short}..." (too old, no marks)`;
    if (reason === 'kill_flagged') return `"${short}..." (too many flags)`;
    if (reason === 'kill_long') return `"${short}..." (too long)`;
    return `"${short}..." (${reason})`;
  });
  return `Cutter removed ${removed.length}: ${reasons.join(', ')}.`;
}

function readerSentence(state: SystemState): string | null {
  const annotations = state.document.flatMap((f) =>
    f.operations.filter((op) => op.entity === 'reader' && op.type === 'annotate' && op.cycle === state.cycle)
  );
  if (annotations.length === 0) return 'Reader scanned the document. No patterns found.';

  const patterns: string[] = [];
  for (const op of annotations) {
    if (op.detail.includes('surv')) patterns.push('survival');
    else if (op.detail.includes('echo')) patterns.push('echo');
    else if (op.detail.includes('dens')) patterns.push('density');
    else if (op.detail.includes('void')) patterns.push('void');
  }
  const unique = [...new Set(patterns)];
  return `Reader detected ${unique.join(', ')} pattern${unique.length > 1 ? 's' : ''}.`;
}

function criteriaSentence(state: SystemState): string | null {
  const shift = state.criteria.history.find((h) => h.cycle === state.cycle);
  if (!shift) return null;
  const desc = shift.criteria.map((c) => {
    const match = c.match(/(\w+) threshold: (\d+).(\d+)/);
    if (!match) return c;
    const [, name, from, to] = match;
    const dir = Number(to) > Number(from) ? 'loosened' : 'tightened';
    return `${name} ${dir} from ${from} to ${to}`;
  });
  return `Criteria shifted: ${desc.join('; ')}.`;
}

function populationSentence(state: SystemState): string {
  const active = countByPredicate(state.document, (f) => f.alive);
  const removed = countByPredicate(state.document, (f) => !f.alive);
  return `Document holds ${active} active fragment${active !== 1 ? 's' : ''}, ${removed} removed.`;
}

export function buildNarrative(state: SystemState): string[] {
  const lines: string[] = [];

  const criteria = criteriaSentence(state);
  if (criteria) lines.push(criteria);

  const writer = writerSentence(state);
  if (writer) lines.push(writer);

  const checker = checkerSentence(state);
  if (checker) lines.push(checker);

  const cutter = cutterSentence(state);
  if (cutter) lines.push(cutter);

  const reader = readerSentence(state);
  if (reader) lines.push(reader);

  lines.push(populationSentence(state));

  return lines;
}

export function runNarrator(state: SystemState): SystemState {
  const narrator = state.entities.narrator;
  const cycle = state.cycle;
  const now = Date.now();

  const narrative = buildNarrative(state);

  const updatedNarrator: EntityState = {
    ...narrator,
    cycle,
    internalLog: [
      ...narrator.internalLog.slice(-50),
      `NAR[${cycle}]:${narrative.length} lines`,
    ],
  };

  return {
    ...state,
    narrative,
    entities: { ...state.entities, narrator: updatedNarrator },
    log: [
      ...state.log,
      {
        cycle,
        timestamp: now,
        entity: 'narrator',
        action: `narrated ${fmtRun(cycle, 'narrative')}`,
      },
    ],
  };
}
