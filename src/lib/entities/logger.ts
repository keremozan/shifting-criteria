import { SystemState, EntityState, EntityId } from '../types';

export function runLogger(state: SystemState): SystemState {
  const logger = state.entities.logger;
  const now = Date.now();
  const cycle = state.cycle;

  // 1. Count operations by entity for this cycle
  const opsByEntity: Record<string, number> = {};
  for (const frag of state.document) {
    for (const op of frag.operations) {
      if (op.cycle === cycle) {
        opsByEntity[op.entity] = (opsByEntity[op.entity] || 0) + 1;
      }
    }
  }

  // 2. Count new fragments, killed fragments, marks added this cycle
  let newFragments = 0;
  let killedFragments = 0;
  let marksAdded = 0;

  for (const frag of state.document) {
    // New: created this cycle
    if (frag.cycle === cycle && frag.operations.some(op => op.type === 'add' && op.cycle === cycle)) {
      newFragments++;
    }

    // Killed: has a remove operation this cycle
    if (frag.operations.some(op => op.type === 'remove' && op.cycle === cycle)) {
      killedFragments++;
    }

    // Marks added this cycle (marks don't have cycle, use timestamp proximity isn't reliable,
    // so count marks from entities that operated this cycle)
    for (const mark of frag.marks) {
      // Marks added during this cycle's operations — approximate via matching cycle operations
      if (frag.operations.some(op => op.cycle === cycle && op.entity === mark.entity)) {
        marksAdded++;
      }
    }
  }

  // 3. Count checker-specific stats
  let checkerEvaluated = 0;
  let checkerFlagged = 0;
  let checkerHighlighted = 0;

  for (const frag of state.document) {
    const checkerOps = frag.operations.filter(op => op.entity === 'checker' && op.cycle === cycle);
    if (checkerOps.length > 0) {
      checkerEvaluated++;
      if (checkerOps.some(op => op.type === 'flag')) checkerFlagged++;
      if (checkerOps.some(op => op.type === 'value')) checkerHighlighted++;
    }
  }

  // Count reader annotations
  let readerAnnotations = 0;
  for (const frag of state.document) {
    readerAnnotations += frag.operations.filter(
      op => op.entity === 'reader' && op.type === 'annotate' && op.cycle === cycle
    ).length;
  }

  // Document stats
  const alive = state.document.filter(f => f.alive).length;
  const dead = state.document.filter(f => !f.alive).length;
  const total = state.document.length;

  // 4. Build summary lines
  const summaryLines: string[] = [`LOG[${cycle}]:SUMMARY`];

  if (opsByEntity['writer']) {
    summaryLines.push(`  writer: +${newFragments} fragments`);
  }
  if (opsByEntity['checker']) {
    summaryLines.push(`  checker: ${checkerEvaluated} evaluated, ${checkerFlagged} flagged, ${checkerHighlighted} highlighted`);
  }
  if (opsByEntity['cutter']) {
    summaryLines.push(`  cutter: ${killedFragments} removed`);
  }
  if (opsByEntity['reader']) {
    summaryLines.push(`  reader: ${readerAnnotations} annotations`);
  }
  summaryLines.push(`  document: ${alive} alive, ${dead} dead, ${total} total`);

  // 5. Update logger's internal state
  const updatedLogger: EntityState = {
    ...logger,
    cycle,
    internalLog: [
      ...logger.internalLog.slice(-50),
      ...summaryLines,
    ],
  };

  return {
    ...state,
    entities: { ...state.entities, logger: updatedLogger },
    log: [...state.log, {
      cycle,
      timestamp: now,
      entity: 'logger' as EntityId,
      action: summaryLines.join('\n'),
    }],
  };
}
