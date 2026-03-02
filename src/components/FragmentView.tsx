'use client';

import { useState } from 'react';
import type { Fragment, Mark, Operation } from '@/lib/types';

const ENTITY_COLORS: Record<string, string> = {
  writer: '#d1d5db',
  checker: '#3b82f6',
  cutter: '#ef4444',
  logger: '#6b7280',
  reader: '#f59e0b',
};

function describeOperation(op: Operation): string {
  if (op.entity === 'writer' && op.type === 'add') {
    return 'writer produced this fragment';
  }
  if (op.entity === 'checker' && op.type === 'value') {
    return 'checker evaluated';
  }
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
  if (op.entity === 'reader' && op.type === 'annotate') {
    return `reader annotated: ${op.detail}`;
  }
  return `${op.entity} ${op.type}`;
}

function describeMark(m: Mark): string {
  if (m.entity === 'checker') {
    if (m.type === 'flag' && m.content.includes('wordCount')) {
      const thresh = m.content.match(/threshold: (\d+)/);
      return `too many words (>${thresh?.[1] || '?'})`;
    }
    if (m.type === 'highlight' && m.content.includes('repetition')) {
      return 'shares words with another fragment';
    }
    if (m.type === 'value-tag' && m.content.includes('hasAdjective')) {
      return 'contains adjectives';
    }
    return m.content;
  }
  if (m.entity === 'cutter') {
    return `killed: ${m.content}`;
  }
  if (m.entity === 'reader') {
    return m.content; // reader notation stays as-is (∴, ≈, etc.)
  }
  return m.content;
}

function MarkBadge({ mark }: { mark: Mark }) {
  const text = describeMark(mark);
  const isFlag = mark.type === 'flag';
  const isComment = mark.type === 'comment';

  if (isComment) return null; // comments rendered separately below

  return (
    <span
      className={`text-[9px] px-1 py-px ${isFlag ? 'font-bold' : ''}`}
      style={{ color: mark.color, opacity: 0.8 }}
    >
      {text}
    </span>
  );
}

export default function FragmentView({ fragment }: { fragment: Fragment }) {
  const [expanded, setExpanded] = useState(false);

  const comments = fragment.marks.filter((m) => m.type === 'comment');
  const otherMarks = fragment.marks.filter((m) => m.type !== 'comment');

  // Deduplicate similar marks (e.g. multiple "contains adjectives" from different cycles)
  const uniqueMarks: Mark[] = [];
  const seen = new Set<string>();
  for (const m of otherMarks) {
    const key = `${m.entity}:${m.type}:${describeMark(m)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMarks.push(m);
    }
  }

  // Count how many times checker evaluated this (to show as a small counter)
  const checkerCycles = fragment.operations.filter(
    (op) => op.entity === 'checker' && op.type === 'value'
  ).length;

  return (
    <div
      className="group border-l-2 border-transparent hover:border-gray-800 pl-2 py-1.5 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Content line */}
      <div className="flex items-baseline gap-2">
        <span className="text-gray-700 text-[10px] shrink-0 select-none">
          c{fragment.cycle}
        </span>

        <span
          className={`text-sm ${
            !fragment.alive
              ? 'line-through text-gray-600 opacity-40'
              : 'text-gray-200'
          }`}
        >
          {fragment.content}
        </span>
      </div>

      {/* Marks — readable descriptions */}
      {uniqueMarks.length > 0 && (
        <div className="ml-8 mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {uniqueMarks.map((m, i) => (
            <MarkBadge key={i} mark={m} />
          ))}
          {checkerCycles > 1 && (
            <span className="text-[9px] text-gray-700">
              checked {checkerCycles}x
            </span>
          )}
        </div>
      )}

      {/* Reader annotations — symbolic notation, always visible */}
      {comments.length > 0 && (
        <div className="ml-8 mt-0.5">
          {comments.map((m, i) => (
            <div
              key={i}
              className="text-[11px] leading-4"
              style={{ color: m.color }}
            >
              {m.content}
            </div>
          ))}
        </div>
      )}

      {/* Expanded: full operation timeline */}
      {expanded && fragment.operations.length > 0 && (
        <div className="ml-8 mt-1.5 pt-1 border-t border-gray-900 space-y-0.5">
          {fragment.operations
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((op) => (
              <div key={op.id} className="text-[10px] leading-tight flex gap-2">
                <span className="text-gray-700 shrink-0">c{op.cycle}</span>
                <span style={{ color: ENTITY_COLORS[op.entity] || '#6b7280' }}>
                  {describeOperation(op)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
