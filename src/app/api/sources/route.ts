import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'sources.json');

function load(): string[] {
  try { return JSON.parse(readFileSync(FILE, 'utf-8')); }
  catch { return []; }
}

export async function POST(req: Request) {
  const { sentence } = await req.json();
  if (!sentence || typeof sentence !== 'string') {
    return NextResponse.json({ error: 'missing sentence' }, { status: 400 });
  }
  const sources = load();
  if (sources.includes(sentence)) {
    return NextResponse.json({ error: 'already in pool' }, { status: 409 });
  }
  sources.push(sentence);
  writeFileSync(FILE, JSON.stringify(sources, null, 2));
  return NextResponse.json({ ok: true, total: sources.length });
}
