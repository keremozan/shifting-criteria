import { NextResponse } from 'next/server';
import { loadState, saveState } from '@/lib/document';
import { runCycle } from '@/lib/engine';

export async function POST() {
  const state = loadState();
  const next = runCycle(state);
  saveState(next);
  return NextResponse.json({ cycle: next.cycle, fragments: next.document.length });
}

export async function GET() {
  const state = loadState();
  return NextResponse.json(state);
}

export async function DELETE() {
  const blank = {
    cycle: 0,
    document: [],
    entities: {
      writer: { id: 'writer', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      checker: { id: 'checker', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      cutter: { id: 'cutter', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      logger: { id: 'logger', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      reader: { id: 'reader', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
    },
    criteria: { current: [], history: [] },
    log: [],
  };
  saveState(blank as any);
  return NextResponse.json({ reset: true });
}
