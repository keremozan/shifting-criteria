import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { SystemState } from './types';

const STATE_PATH = path.join(process.cwd(), 'data', 'state.json');

export function loadState(): SystemState {
  const raw = readFileSync(STATE_PATH, 'utf-8');
  return JSON.parse(raw);
}

export function saveState(state: SystemState): void {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}
