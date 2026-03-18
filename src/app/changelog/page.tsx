import Link from 'next/link';
import { changelog, type ChangeTag } from '@/lib/changelog';

const TAG_COLORS: Record<ChangeTag, string> = {
  entity: '#a78bfa',
  ui: '#60a5fa',
  page: '#4ade80',
  system: '#fbbf24',
};

function groupByDate(entries: typeof changelog) {
  const groups: Record<string, typeof changelog> = {};
  for (const entry of entries) {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry);
  }
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => [date, [...entries].reverse()] as const);
}

export default function ChangelogPage() {
  const grouped = groupByDate(changelog);

  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-6">
      <header className="flex items-baseline justify-between py-5 border-b border-gray-800">
        <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
          changelog
        </h1>
        <div className="flex items-baseline gap-4">
          <div className="flex items-baseline gap-3">
            {(Object.keys(TAG_COLORS) as ChangeTag[]).map((tag) => (
              <span key={tag} className="flex items-center gap-1">
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: TAG_COLORS[tag] }}
                />
                <span className="text-[9px] text-gray-600">{tag}</span>
              </span>
            ))}
          </div>
          <Link
            href="/"
            className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors"
          >
            back
          </Link>
        </div>
      </header>

      <main className="flex-1 py-8 space-y-10">
        {grouped.map(([date, entries]) => (
          <div key={date}>
            <div className="text-[10px] text-gray-600 mb-4 pb-1.5 border-b border-gray-800 tracking-wide">
              {date}
            </div>
            <div className="space-y-0">
              {entries.map((entry) => {
                const color = TAG_COLORS[entry.tag];
                return (
                  <div key={entry.id} className="py-3 border-b border-gray-800/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[11px] text-gray-200 font-medium">
                        {entry.title}
                      </span>
                      <span
                        className="text-[8px] uppercase tracking-wider px-1.5 py-px rounded"
                        style={{
                          color,
                          backgroundColor: `${color}15`,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {entry.tag}
                      </span>
                      <span className="text-[9px] text-gray-600">{entry.time}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 leading-relaxed">
                      {entry.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
