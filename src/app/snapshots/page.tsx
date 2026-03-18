'use client';

import { useState } from 'react';
import Link from 'next/link';
import { snapshots } from '@/lib/data';

// Snapshots are archival. No editor revisions, no taxonomy rewrites.
// They render exactly as they were saved.

interface Fragment {
  id: string;
  content: string;
  alive: boolean;
  cycle: number;
  marks: { entity: string; type: string; content: string; color: string }[];
  operations: { id: string; entity: string; type: string; cycle: number; detail: string }[];
}

function getLifecycleColor(f: Fragment, snapCycle: number) {
  if (!f.alive) return '#f87171';
  if (f.cycle === snapCycle) return '#4ade80';
  const hasFlagMark = f.marks.some((m) => m.type === 'flag');
  const age = snapCycle - f.cycle;
  if (hasFlagMark && age > 1) return '#a78bfa';
  if (hasFlagMark) return '#fbbf24';
  return 'transparent';
}

function getCutReason(f: Fragment) {
  const op = f.operations.find((o) => o.entity === 'cutter' && o.type === 'remove');
  if (!op) return '';
  const match = op.detail.match(/REASON\((\w+)\)/);
  if (!match) return '';
  const r = match[1];
  if (r === 'kill_old_unmarked') return 'too old, no marks';
  if (r === 'kill_flagged') return 'too many flags';
  if (r === 'kill_long') return 'too long';
  return r;
}

function getCheckerMarks(f: Fragment) {
  return f.marks.filter((m) => m.entity === 'checker').map((m) => {
    if (m.type === 'flag' && m.content.includes('wordCount')) return 'word count';
    if (m.type === 'highlight' && m.content.includes('repetition')) return 'repetition';
    if (m.type === 'value-tag' && m.content.includes('hasAdjective')) return 'adjectives';
    return m.content;
  });
}

function getReaderAnnotations(f: Fragment) {
  return f.marks.filter((m) => m.entity === 'reader' && m.type === 'comment').map((m) => m.content);
}

const MARK_COLORS: Record<string, string> = {
  'word count': '#f87171',
  'repetition': '#60a5fa',
  'adjectives': '#a78bfa',
};

export default function SnapshotsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-6">
      <header className="flex items-baseline justify-between py-5 border-b border-gray-800">
        <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
          snapshots
        </h1>
        <Link
          href="/"
          className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors"
        >
          back
        </Link>
      </header>

      <main className="flex-1 py-8 space-y-0">
        {snapshots.length === 0 && (
          <div className="text-[10px] text-gray-600 py-4">no snapshots archived.</div>
        )}
        {snapshots.slice().reverse().map((snap) => {
          const isOpen = snap.id === expandedId;
          const cycle = snap.state.cycle;
          const doc = snap.state.document as Fragment[];

          return (
            <div key={snap.id} className="border-b border-gray-800/50">
              <div
                className="py-4 cursor-pointer hover:bg-gray-900/20 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : snap.id)}
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] text-gray-300 font-medium">cycle {snap.cycle}</span>
                  <span className="text-[9px] text-gray-600">{snap.date} {snap.time}</span>
                  <span className="text-[9px] text-gray-600 ml-auto">
                    {snap.alive} alive / {snap.dead} dead
                  </span>
                </div>
                {snap.state.narrative && snap.state.narrative.length > 0 && (
                  <div className="mt-2 text-[10px] text-gray-500 leading-relaxed">
                    {snap.state.narrative[0]}
                  </div>
                )}
              </div>

              {isOpen && (
                <div className="pb-6 space-y-5">
                  {snap.state.narrative && snap.state.narrative.length > 0 && (
                    <div className="space-y-0.5 pl-3 border-l border-gray-800">
                      {snap.state.narrative.map((line: string, i: number) => (
                        <div key={i} className="text-[10px] text-gray-500 leading-relaxed">{line}</div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">document</div>
                    <div className="space-y-0">
                      {doc.map((f) => {
                        const color = getLifecycleColor(f, cycle);
                        const cutReason = getCutReason(f);
                        const checkerMarks = getCheckerMarks(f);
                        const readerNotes = getReaderAnnotations(f);

                        return (
                          <div key={f.id} className="py-2 pl-3 border-l-2" style={{ borderColor: color }}>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[9px] text-gray-600 shrink-0">c{f.cycle}</span>
                              {!f.alive && (
                                <span className="text-[8px] uppercase tracking-wider shrink-0 px-1 py-px rounded"
                                  style={{ color: '#f87171', backgroundColor: '#f8717115', border: '1px solid #f8717130' }}>
                                  dead
                                </span>
                              )}
                              {f.alive && f.cycle === cycle && (
                                <span className="text-[8px] uppercase tracking-wider shrink-0 px-1 py-px rounded"
                                  style={{ color: '#4ade80', backgroundColor: '#4ade8015', border: '1px solid #4ade8030' }}>
                                  new
                                </span>
                              )}
                              <span className={`text-[11px] ${f.alive ? 'text-gray-300' : 'text-gray-600 line-through opacity-50'}`}>
                                {f.content}
                              </span>
                            </div>
                            {checkerMarks.length > 0 && (
                              <div className="ml-8 mt-1 flex flex-wrap gap-1">
                                {checkerMarks.map((m, i) => (
                                  <span key={i} className="text-[8px] px-1.5 py-px rounded"
                                    style={{ color: MARK_COLORS[m] || '#6b7280', backgroundColor: `${MARK_COLORS[m] || '#6b7280'}15`, border: `1px solid ${MARK_COLORS[m] || '#6b7280'}30` }}>
                                    {m}
                                  </span>
                                ))}
                                {cutReason && (
                                  <span className="text-[8px] text-red-400/60 px-1.5 py-px rounded"
                                    style={{ backgroundColor: '#f8717115', border: '1px solid #f8717130' }}>
                                    {cutReason}
                                  </span>
                                )}
                              </div>
                            )}
                            {readerNotes.length > 0 && (
                              <div className="ml-8 mt-1">
                                {readerNotes.map((note, i) => (
                                  <div key={i} className="text-[10px] text-yellow-500/70">{note}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1">criteria</div>
                    <div className="text-[10px] text-gray-500">
                      {(() => {
                        const thresholds = (snap.state.entities?.checker as any)?.rules?.criteriaThresholds;
                        if (!thresholds) return 'default thresholds';
                        return Object.entries(thresholds).map(([k, v]) => `${k}: ${v}`).join(', ');
                      })()}
                    </div>
                    {snap.state.criteria.history.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {snap.state.criteria.history.map((h: any, i: number) => (
                          <div key={i} className="text-[9px] text-gray-600">
                            cycle {h.cycle}: {h.criteria.join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}
