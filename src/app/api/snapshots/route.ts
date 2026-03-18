import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'snapshots.json');

function load() {
  try { return JSON.parse(readFileSync(FILE, 'utf-8')); }
  catch { return []; }
}

export async function POST(req: Request) {
  const body = await req.json();
  const snapshots = load();

  const snapshot = {
    id: `snap-${Date.now()}`,
    date: new Date().toISOString().slice(0, 10),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    cycle: body.cycle,
    alive: body.alive,
    dead: body.dead,
    convention: 'generation',
    state: body.state,
  };

  snapshots.push(snapshot);
  writeFileSync(FILE, JSON.stringify(snapshots, null, 2));
  return NextResponse.json({ ok: true, id: snapshot.id });
}
