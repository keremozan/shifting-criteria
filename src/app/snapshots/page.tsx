'use client';

import { useState } from 'react';
import Link from 'next/link';
import { snapshots } from '@/lib/data';
import { editorRevise } from '@/lib/editor';
import { fmtRun } from '@/lib/taxonomy';

interface Fragment {
  id: string;
  content: string;
  alive: boolean;
  cycle: number;
  marks: { entity: string; type: string; content: string; color: string }[];
  operations: { id: string; entity: string; type: string; cycle: number; detail: string }[];
}

const LIFECYCLE_COLORS: Record<string, string> = {
  new: '#4ade80',
  flagged: '#fbbf24',
  surviving: '#a78bfa',
  removed: '#f87171',
};

function getLifecycle(f: Fragment, snapCycle: number) {
  if (!f.alive) return { label: 'removed', color: LIFECYCLE_COLORS.removed };
  if (f.cycle === snapCycle) return { label: 'new', color: LIFECYCLE_COLORS.new };
  const hasFlagMark = f.marks.some((m) => m.type === 'flag');
  const age = snapCycle - f.cycle;
  if (hasFlagMark && age > 1) return { label: 'surviving', color: LIFECYCLE_COLORS.surviving };
  if (hasFlagMark) return { label: 'flagged', color: LIFECYCLE_COLORS.flagged };
  return { label: '', color: 'transparent' };
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
          const living = doc.filter((f) => f.alive);
          const dead = doc.filter((f) => !f.alive);

          return (
            <div key={snap.id} className="border-b border-gray-800/50">
              <div
                className="py-4 cursor-pointer hover:bg-gray-900/20 transition-colors"
                onClick={() => setExpandedId(isOpen ? null : snap.id)}
              >
                <div className="flex items-baseline gap-3">
                  <span className="text-[11px] text-gray-300 font-medium">{fmtRun(snap.cycle, 'snapshot')}</span>
                  <span className="text-[9px] text-gray-600">{snap.date} {snap.time}</span>
                  <span className="text-[9px] text-gray-600 ml-auto"
                    dangerouslySetInnerHTML={{
                      __html: editorRevise(`${snap.alive} alive / ${snap.dead} dead`, cycle)
                    }}
                  />
                </div>
                {snap.state.narrative && snap.state.narrative.length > 0 && (
                  <div className="mt-2 text-[10px] text-gray-500 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: editorRevise(snap.state.narrative[0], cycle) }}
                  />
                )}
              </div>

              {isOpen && (
                <div className="pb-6 space-y-5">
                  {snap.state.narrative && snap.state.narrative.length > 0 && (
                    <div className="space-y-0.5 pl-3 border-l border-gray-800">
                      {snap.state.narrative.map((line: string, i: number) => (
                        <div key={i} className="text-[10px] text-gray-500 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: editorRevise(line, cycle) }}
                        />
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">document</div>
                    <div className="space-y-0">
                      {doc.map((f) => {
                        const lc = getLifecycle(f, cycle);
                        const cutReason = getCutReason(f);
                        const checkerMarks = getCheckerMarks(f);
                        const readerNotes = getReaderAnnotations(f);

                        return (
                          <div key={f.id} className="py-2 pl-3 border-l-2" style={{ borderColor: lc.color }}>
                            <div className="flex items-baseline gap-2">
                              <span className="text-[9px] text-gray-600 shrink-0">{fmtRun(f.cycle, 'fragment')}</span>
                              {lc.label && (
                                <span className="text-[8px] uppercase tracking-wider shrink-0 px-1 py-px rounded"
                                  style={{ color: lc.color, backgroundColor: `${lc.color}15`, border: `1px solid ${lc.color}30` }}
                                  dangerouslySetInnerHTML={{ __html: editorRevise(lc.label, f.cycle) }}
                                />
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
                                    style={{ backgroundColor: '#f8717115', border: '1px solid #f8717130' }}
                                    dangerouslySetInnerHTML={{ __html: editorRevise(cutReason, f.cycle) }}
                                  />
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
                            {fmtRun(h.cycle, 'snapshot')}: {h.criteria.join(', ')}
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
