'use client';

import Link from 'next/link';
import { metalog as entries, threads } from '@/lib/data';
import HighlightLayer from '@/components/HighlightTool';

const TAG_COLORS: Record<string, string> = {
  'formalism': '#f87171',
  'legibility': '#60a5fa',
  'meta-levels': '#a78bfa',
  'convention': '#4ade80',
  'content vs form': '#fbbf24',
  'Sontag': '#f472b6',
  'fragments': '#9ca3af',
  'claims': '#fb923c',
  'observations': '#60a5fa',
  'instructions': '#4ade80',
  'stakes': '#f87171',
  'tooling': '#6b7280',
  'reader layer': '#a78bfa',
  'imported meaning': '#fbbf24',
  'writing rules': '#f87171',
  'structure': '#60a5fa',
  'diagrams': '#4ade80',
  'language': '#fb923c',
  'inherited assumptions': '#9ca3af',
  'Editor': '#34d399',
};

function getTagColor(tag: string) {
  return TAG_COLORS[tag] || '#6b7280';
}

const AUTHOR_STYLES: Record<string, { dot: string; nameColor: string; name: string }> = {
  kerem: { dot: '#6b7280', nameColor: '#6b7280', name: 'kerem' },
  architect: { dot: '#3b82f6', nameColor: '#60a5fa', name: 'architect' },
};

function getThread(entryId: number) {
  return threads.find((t) => entryId >= t.startEntry && entryId <= t.endEntry);
}

function isThreadStart(entryId: number) {
  return threads.some((t) => t.startEntry === entryId);
}

export default function MetalogPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-6">
      <header className="flex items-baseline justify-between py-5 border-b border-gray-800">
        <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
          metalog
        </h1>
        <Link
          href="/"
          className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors"
        >
          back
        </Link>
      </header>

      {/* Thread index */}
      <div className="py-4 border-b border-gray-800">
        <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">index</div>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {threads.map((t) => (
            <a
              key={t.id}
              href={`#thread-${t.id}`}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              {t.summary}
            </a>
          ))}
        </div>
      </div>

      <div className="flex gap-6 flex-1 relative" data-metalog-container>
        <main className="flex-1 py-8 space-y-0 min-w-0 overflow-x-hidden">
          {entries.map((entry) => {
            const s = AUTHOR_STYLES[entry.author] || AUTHOR_STYLES.kerem;
            const thread = getThread(entry.id);
            const isStart = isThreadStart(entry.id);
            const lineColor = thread ? getTagColor(thread.tags[0]) + '40' : 'transparent';

            return (
              <div key={entry.id}>
                {isStart && thread && (
                  <div className="pt-6 pb-2" id={`thread-${thread.id}`}>
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] text-gray-400">{thread.summary}</div>
                      <div className="flex gap-1.5">
                        {thread.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.5 rounded tracking-wide"
                            style={{
                              color: getTagColor(tag),
                              backgroundColor: getTagColor(tag) + '15',
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {thread.subtext && (
                      <div className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                        {thread.subtext}
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="py-4 border-b border-gray-800/50 pl-3 border-l-2"
                  style={{ borderLeftColor: lineColor }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.dot }}
                    />
                    {s.name && (
                      <span className="text-[9px] font-medium" style={{ color: s.nameColor }}>
                        {s.name}
                      </span>
                    )}
                    <span className="text-[9px] text-gray-600">{entry.time}</span>
                  </div>
                  <div
                    data-entry-id={entry.id}
                    className="text-[12px] text-gray-300 leading-[1.7] metalog-content"
                    dangerouslySetInnerHTML={{ __html: entry.comment }}
                  />
                  {entry.diagram && (
                    <pre className="mt-3 text-[9px] text-gray-500 leading-[1.5] overflow-x-auto pl-4 border-l border-gray-800">
                      {entry.diagram}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </main>

        <HighlightLayer />
      </div>
    </div>
  );
}
