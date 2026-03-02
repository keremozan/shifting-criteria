import { SystemState } from './types';
import { runWriter } from './entities/writer';
import { runChecker } from './entities/checker';
import { runCutter } from './entities/cutter';
import { runReader } from './entities/reader';
import { runLogger } from './entities/logger';

export function runCycle(state: SystemState): SystemState {
  let next = { ...state, cycle: state.cycle + 1 };

  // Entity order matters: Writer produces, Checker evaluates,
  // Cutter removes, Reader interprets, Logger records
  next = runWriter(next);
  next = runChecker(next);
  next = runCutter(next);
  next = runReader(next);
  next = runLogger(next);

  return next;
}
