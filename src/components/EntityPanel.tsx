'use client';

import { useState } from 'react';
import type { EntityId, EntityState } from '@/lib/types';

const ENTITY_COLORS: Record<EntityId, string> = {
  writer: '#d1d5db',
  checker: '#3b82f6',
  cutter: '#ef4444',
  logger: '#6b7280',
  reader: '#f59e0b',
};

const ENTITY_ROLES: Record<EntityId, string> = {
  writer: 'produces document fragments via grammar expansion',
  checker: 'evaluates fragments against shifting criteria',
  cutter: 'removes fragments that fail criteria',
  reader: 'interprets patterns, annotates in symbolic notation',
  logger: 'records all operations',
};

interface Props {
  entity: EntityState;
}

export default function EntityPanel({ entity }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = ENTITY_COLORS[entity.id];

  return (
    <div className="border border-gray-900 rounded">
      {/* Collapsed header */}
      <button
        className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-gray-900/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span
          className="inline-block w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-xs" style={{ color }}>
          {entity.id}
        </span>
        <span className="text-[10px] text-gray-600 ml-auto">
          {expanded ? '\u25B4' : '\u25BE'}
        </span>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-2 pb-2 space-y-2 border-t border-gray-900">
          {/* Role */}
          <div className="text-[10px] text-gray-600 pt-1.5">
            {ENTITY_ROLES[entity.id]}
          </div>

          {/* Internal log */}
          {entity.internalLog.length > 0 && (
            <div>
              <div className="text-[9px] text-gray-700 uppercase tracking-wider mb-0.5">
                log
              </div>
              <div className="max-h-32 overflow-y-auto space-y-0">
                {entity.internalLog
                  .slice()
                  .reverse()
                  .map((entry, i) => (
                    <div
                      key={i}
                      className="text-[10px] leading-tight text-gray-500 py-0.5"
                    >
                      {entry}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {Object.keys(entity.rules).length > 0 && (
            <div>
              <div className="text-[9px] text-gray-700 uppercase tracking-wider mb-0.5">
                rules
              </div>
              <pre className="text-[10px] leading-tight text-gray-500 overflow-x-auto">
                {JSON.stringify(entity.rules, null, 2)}
              </pre>
            </div>
          )}

          {/* Vocabulary */}
          {entity.vocabulary.length > 0 && (
            <div>
              <div className="text-[9px] text-gray-700 uppercase tracking-wider mb-0.5">
                vocabulary
              </div>
              <div className="text-[10px] text-gray-500 leading-tight">
                {entity.vocabulary.join(', ')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
