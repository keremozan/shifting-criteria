'use client';

import { useState } from 'react';
import type { Fragment, Mark, Operation } from '@/lib/types';
import { editorRevise, EDITOR_ACTIVE_FROM_CYCLE } from '@/lib/editor';

const ENTITY_COLORS: Record<string, string> = {
  writer: '#9ca3af',
  checker: '#60a5fa',
  cutter: '#f87171',
  logger: '#6b7280',
  reader: '#fbbf24',
  narrator: '#a78bfa',
};

type LifecycleState = 'new' | 'clean' | 'flagged' | 'surviving' | 'dead';

function getLifecycleState(fragment: Fragment, currentCycle: number): LifecycleState {
  if (!fragment.alive) return 'dead';
  if (fragment.cycle === currentCycle) return 'new';
  const hasFlagMark = fragment.marks.some((m) => m.type === 'flag');
  const age = currentCycle - fragment.cycle;
  if (hasFlagMark && age > 1) return 'surviving';
  if (hasFlagMark) return 'flagged';
  return 'clean';
}

const LIFECYCLE_STYLES: Record<LifecycleState, { border: string; label: string; textClass: string }> = {
  new: { border: '#4ade80', label: 'new', textClass: 'text-gray-200' },
  clean: { border: 'transparent', label: '', textClass: 'text-gray-300' },
  flagged: { border: '#fbbf24', label: 'flagged', textClass: 'text-gray-200' },
  surviving: { border: '#a78bfa', label: 'surviving', textClass: 'text-gray-200' },
  dead: { border: '#f87171', label: 'dead', textClass: 'text-gray-600 line-through opacity-40' },
};

function describeOperation(op: Operation): string {
  if (op.entity === 'writer' && op.type === 'add') return 'writer produced this fragment';
  if (op.entity === 'checker' && op.type === 'value') return 'checker evaluated';
  if (op.entity === 'cutter' && op.type === 'remove') {
    const match = op.detail.match(/REASON\((\w+)\)/);
    if (match) {
      const reason = match[1];
      if (reason === 'kill_old_unmarked') return 'cutter removed: too old, no marks';
      if (reason === 'kill_flagged') return 'cutter removed: too many flags';
      if (reason === 'kill_long') return 'cutter removed: too long';
      return `cutter removed: ${reason}`;
    }
    return 'cutter removed';
  }
  if (op.entity === 'reader' && op.type === 'annotate') return `reader annotated: ${op.detail}`;
  return `${op.entity} ${op.type}`;
}

function describeMark(m: Mark): string {
  if (m.entity === 'checker') {
    if (m.type === 'flag' && m.content.includes('wordCount')) {
      const thresh = m.content.match(/threshold: (\d+)/);
      return `too many words (>${thresh?.[1] || '?'})`;
    }
    if (m.type === 'highlight' && m.content.includes('repetition')) return 'shares words with another fragment';
    if (m.type === 'value-tag' && m.content.includes('hasAdjective')) return 'contains adjectives';
    return m.content;
  }
  if (m.entity === 'cutter') return `killed: ${m.content}`;
  if (m.entity === 'reader') return m.content;
  return m.content;
}

const MARK_COLORS: Record<string, string> = {
  flag: '#f87171',
  highlight: '#60a5fa',
  'value-tag': '#a78bfa',
  label: '#6b7280',
};

function MarkBadge({ mark }: { mark: Mark }) {
  const text = describeMark(mark);
  if (mark.type === 'comment') return null;
  const color = MARK_COLORS[mark.type] || '#6b7280';
  return (
    <span
      className={`text-[9px] px-1.5 py-px rounded ${mark.type === 'flag' ? 'font-medium' : ''}`}
      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
    >
      {text}
    </span>
  );
}

export default function FragmentView({ fragment, currentCycle }: { fragment: Fragment; currentCycle: number }) {
  const [expanded, setExpanded] = useState(false);
  const lifecycle = getLifecycleState(fragment, currentCycle);
  const style = LIFECYCLE_STYLES[lifecycle];
  const comments = fragment.marks.filter((m) => m.type === 'comment');
  const otherMarks = fragment.marks.filter((m) => m.type !== 'comment');

  const uniqueMarks: Mark[] = [];
  const seen = new Set<string>();
  for (const m of otherMarks) {
    const key = `${m.entity}:${m.type}:${describeMark(m)}`;
    if (!seen.has(key)) { seen.add(key); uniqueMarks.push(m); }
  }

  const checkerCycles = fragment.operations.filter((op) => op.entity === 'checker' && op.type === 'value').length;

  return (
    <div
      className="group pl-3 py-1.5 cursor-pointer border-l-2 hover:bg-gray-900/30 transition-colors rounded-r"
      style={{ borderColor: style.border }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-gray-600 text-[10px] shrink-0 select-none">c{fragment.cycle}</span>
        {style.label && (
          <span className="text-[8px] uppercase tracking-wider shrink-0 px-1 py-px rounded"
            style={{ color: style.border, backgroundColor: `${style.border}15`, border: `1px solid ${style.border}30` }}
            dangerouslySetInnerHTML={{ __html: editorRevise(style.label, fragment.cycle) }}
          />
        )}
        <span className={`text-sm ${style.textClass}`}>{fragment.content}</span>
      </div>

      {uniqueMarks.length > 0 && (
        <div className="ml-8 mt-1 flex flex-wrap gap-x-2 gap-y-1">
          {uniqueMarks.map((m, i) => <MarkBadge key={i} mark={m} />)}
          {checkerCycles > 1 && <span className="text-[9px] text-gray-600">checked {checkerCycles}x</span>}
        </div>
      )}

      {comments.length > 0 && (
        <div className="ml-8 mt-1">
          {comments.map((m, i) => (
            <div key={i} className="text-[11px] leading-4 text-yellow-500/80">{m.content}</div>
          ))}
        </div>
      )}

      {expanded && fragment.operations.length > 0 && (
        <div className="ml-8 mt-2 pt-2 border-t border-gray-800 space-y-0.5">
          {fragment.operations.slice().sort((a, b) => a.timestamp - b.timestamp).map((op) => (
            <div key={op.id} className="text-[10px] leading-tight flex gap-2">
              <span className="text-gray-600 shrink-0">c{op.cycle}</span>
              <span style={{ color: ENTITY_COLORS[op.entity] || '#6b7280' }}>{describeOperation(op)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
