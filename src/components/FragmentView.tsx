'use client';

import { useState } from 'react';
import type { Fragment, Operation } from '@/lib/types';

const ENTITY_COLORS: Record<string, string> = {
  writer: '#d1d5db',
  checker: '#3b82f6',
  cutter: '#ef4444',
  logger: '#6b7280',
  reader: '#f59e0b',
};

function OperationRow({ op }: { op: Operation }) {
  return (
    <div className="flex gap-2 text-[10px] leading-tight py-0.5">
      <span className="text-gray-600 shrink-0">c{op.cycle}</span>
      <span
        className="shrink-0"
        style={{ color: ENTITY_COLORS[op.entity] || '#6b7280' }}
      >
        {op.entity}
      </span>
      <span className="text-gray-500">{op.type}</span>
      <span className="text-gray-400 truncate">{op.detail}</span>
    </div>
  );
}

export default function FragmentView({ fragment }: { fragment: Fragment }) {
  const [expanded, setExpanded] = useState(false);

  const comments = fragment.marks.filter((m) => m.type === 'comment');
  const flags = fragment.marks.filter((m) => m.type === 'flag');
  const valueTags = fragment.marks.filter((m) => m.type === 'value-tag');
  const highlights = fragment.marks.filter((m) => m.type === 'highlight');
  const labels = fragment.marks.filter((m) => m.type === 'label');

  const hasMark = fragment.marks.length > 0;

  return (
    <div
      className="group border-l border-transparent hover:border-gray-800 pl-2 py-1 cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Main content line */}
      <div className="flex items-start gap-2">
        <span className="text-gray-700 text-[10px] leading-5 shrink-0 select-none">
          c{fragment.cycle}
        </span>

        <span
          className={`leading-5 text-sm ${
            !fragment.alive
              ? 'line-through text-gray-600 opacity-50'
              : 'text-gray-200'
          }`}
        >
          {fragment.content}
        </span>

        {/* Inline mark indicators */}
        {hasMark && (
          <span className="flex items-center gap-1 shrink-0 mt-1">
            {flags.map((m, i) => (
              <span
                key={`flag-${i}`}
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: m.color }}
                title={m.content}
              />
            ))}
            {highlights.map((m, i) => (
              <span
                key={`hl-${i}`}
                className="inline-block w-1.5 h-1.5 rounded-sm"
                style={{ backgroundColor: m.color }}
                title={m.content}
              />
            ))}
            {valueTags.map((m, i) => (
              <span
                key={`vt-${i}`}
                className="text-[9px] px-1 rounded"
                style={{
                  color: m.color,
                  border: `1px solid ${m.color}33`,
                }}
              >
                {m.content}
              </span>
            ))}
            {labels.map((m, i) => (
              <span
                key={`lb-${i}`}
                className="text-[9px] px-1 opacity-70"
                style={{ color: m.color }}
              >
                {m.content}
              </span>
            ))}
          </span>
        )}
      </div>

      {/* Reader comments (annotations) — always visible */}
      {comments.length > 0 && (
        <div className="ml-8 mt-0.5">
          {comments.map((m, i) => (
            <div
              key={`comment-${i}`}
              className="text-[11px] leading-4 italic"
              style={{ color: m.color }}
            >
              {m.content}
            </div>
          ))}
        </div>
      )}

      {/* Expanded operation history */}
      {expanded && fragment.operations.length > 0 && (
        <div className="ml-8 mt-1 pt-1 border-t border-gray-900">
          {fragment.operations
            .slice()
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((op) => (
              <OperationRow key={op.id} op={op} />
            ))}
        </div>
      )}
    </div>
  );
}
