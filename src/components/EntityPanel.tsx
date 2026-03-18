'use client';

import { useState } from 'react';
import type { EntityId, EntityState } from '@/lib/types';

const ENTITY_COLORS: Record<EntityId, string> = {
  writer: '#9ca3af',
  checker: '#60a5fa',
  cutter: '#f87171',
  logger: '#6b7280',
  reader: '#fbbf24',
  narrator: '#a78bfa',
};

const ENTITY_ROLES: Record<EntityId, string> = {
  writer: 'produces document fragments via grammar expansion',
  checker: 'evaluates fragments against shifting criteria',
  cutter: 'removes fragments that fail criteria',
  reader: 'interprets patterns, annotates in symbolic notation',
  narrator: 'translates each cycle into plain language',
  logger: 'records all operations',
};

interface Props {
  entity: EntityState;
}

export default function EntityPanel({ entity }: Props) {
  const [expanded, setExpanded] = useState(false);
  const color = ENTITY_COLORS[entity.id];

  return (
    <div>
      <button
        className="w-full flex items-center gap-2 px-1 py-1.5 text-left hover:bg-gray-900/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium" style={{ color }}>{entity.id}</span>
        <span className="text-[10px] text-gray-600 ml-auto">{expanded ? '\u25B4' : '\u25BE'}</span>
      </button>

      {expanded && (
        <div className="px-1 pb-2 space-y-2 border-t border-gray-800/50">
          <div className="text-[10px] text-gray-500 pt-1.5">{ENTITY_ROLES[entity.id]}</div>

          {entity.internalLog.length > 0 && (
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">log</div>
              <div className="max-h-32 overflow-y-auto space-y-0">
                {entity.internalLog.slice().reverse().map((entry, i) => (
                  <div key={i} className="text-[10px] leading-tight text-gray-500 py-0.5">{entry}</div>
                ))}
              </div>
            </div>
          )}

          {Object.keys(entity.rules).length > 0 && (
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">rules</div>
              <pre className="text-[10px] leading-tight text-gray-500 overflow-x-auto">
                {JSON.stringify(entity.rules, null, 2)}
              </pre>
            </div>
          )}

          {entity.vocabulary.length > 0 && (
            <div>
              <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-0.5">vocabulary</div>
              <div className="text-[10px] text-gray-500 leading-tight">{entity.vocabulary.join(', ')}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
