'use client';

import Link from 'next/link';
import { diagrams } from '@/lib/data';

export default function DiagramsPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-6">
      <header className="flex items-baseline justify-between py-5 border-b border-gray-800">
        <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
          diagrams
        </h1>
        <Link
          href="/"
          className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors"
        >
          back
        </Link>
      </header>

      <main className="flex-1 py-8 space-y-10">
        {diagrams.length === 0 && (
          <div className="text-[10px] text-gray-600">no diagrams yet.</div>
        )}
        {[...diagrams].reverse().map((d: any) => {
          const isSuperseded = !!d.supersededBy;

          return (
            <div key={d.id} className="py-4 border-b border-gray-800/50">
              <div className="flex items-baseline gap-3 mb-4">
                <span className={`text-[11px] font-medium ${isSuperseded ? 'text-gray-600 line-through' : 'text-gray-200'}`}>
                  {d.title}
                </span>
                <span className="text-[9px] text-gray-600">{d.date} {d.time}</span>
                {d.metalogEntryId && (
                  <Link
                    href="/metalog"
                    className="text-[9px] text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    metalog #{d.metalogEntryId}
                  </Link>
                )}
                {isSuperseded && (
                  <span className="text-[9px] text-gray-600">superseded by #{d.supersededBy}</span>
                )}
                {d.supersedes && (
                  <span className="text-[9px] text-gray-600">supersedes #{d.supersedes}</span>
                )}
              </div>
              <pre className={`text-[10px] leading-[1.5] overflow-x-auto ${isSuperseded ? 'text-gray-700 opacity-50' : 'text-gray-500'}`}>
                {d.content}
              </pre>
            </div>
          );
        })}
      </main>
    </div>
  );
}
