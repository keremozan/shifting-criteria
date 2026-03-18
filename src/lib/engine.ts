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
