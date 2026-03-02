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
