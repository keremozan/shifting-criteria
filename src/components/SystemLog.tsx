'use client';

import type { LogEntry, EntityId } from '@/lib/types';

const ENTITY_COLORS: Record<EntityId, string> = {
  writer: '#d1d5db',
  checker: '#3b82f6',
  cutter: '#ef4444',
  logger: '#6b7280',
  reader: '#f59e0b',
};

interface Props {
  entries: LogEntry[];
}

export default function SystemLog({ entries }: Props) {
  if (entries.length === 0) {
    return (
      <div className="text-[10px] text-gray-700">no log entries yet.</div>
    );
  }

  const sorted = entries.slice().sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-h-40 overflow-y-auto space-y-0">
      {sorted.map((entry, i) => (
        <div key={i} className="flex gap-2 text-[10px] leading-4 py-0.5">
          <span className="text-gray-700 shrink-0">c{entry.cycle}</span>
          <span
            className="shrink-0 w-12"
            style={{ color: ENTITY_COLORS[entry.entity] || '#6b7280' }}
          >
            {entry.entity}
          </span>
          <span className="text-gray-500 truncate">{entry.action}</span>
        </div>
      ))}
    </div>
  );
}
