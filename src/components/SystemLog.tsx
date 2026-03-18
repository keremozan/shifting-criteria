'use client';

import type { LogEntry, EntityId } from '@/lib/types';

const ENTITY_COLORS: Record<EntityId, string> = {
  writer: '#9ca3af',
  checker: '#60a5fa',
  cutter: '#f87171',
  logger: '#6b7280',
  reader: '#fbbf24',
  narrator: '#a78bfa',
};

interface Props {
  entries: LogEntry[];
}

export default function SystemLog({ entries }: Props) {
  if (entries.length === 0) {
    return <div className="text-[10px] text-gray-600">no log entries yet.</div>;
  }

  const sorted = entries.slice().sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="max-h-40 overflow-y-auto space-y-0">
      {sorted.map((entry, i) => (
        <div key={i} className="flex gap-2 text-[10px] leading-4 py-0.5">
          <span className="text-gray-600 shrink-0">c{entry.cycle}</span>
          <span className="shrink-0 w-14 font-medium" style={{ color: ENTITY_COLORS[entry.entity] || '#6b7280' }}>
            {entry.entity}
          </span>
          <span className="text-gray-500 truncate">{entry.action}</span>
        </div>
      ))}
    </div>
  );
}
