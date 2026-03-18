'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { metalog, sources } from '@/lib/data';
import { poetSelect, type PoetSelection } from '@/lib/poet';

export default function PoetPage() {
  const [pool, setPool] = useState<string[]>([...sources]);
  const [added, setAdded] = useState<Set<string>>(new Set());

  // Poet selects top candidates
  const selections = useMemo(() => {
    return poetSelect(metalog, pool, 20);
  }, [pool]);

  async function addToPool(sentence: string) {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence }),
      });
      if (res.ok) {
        setPool((prev) => [...prev, sentence]);
        setAdded((prev) => new Set(prev).add(sentence));
      }
    } catch {
      // silent on public site
    }
  }

  function addAll() {
    selections.forEach((s) => {
      if (!added.has(s.sentence)) addToPool(s.sentence);
    });
  }

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto px-6">
      <header className="flex items-baseline justify-between py-5 border-b border-gray-800">
        <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
          poet
        </h1>
        <Link
          href="/"
          className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors"
        >
          back
        </Link>
      </header>

      <main className="flex-1 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <div className="text-[10px] text-gray-500">
            {pool.length} in pool / {selections.length} candidates scored
            {added.size > 0 && <span className="text-green-500 ml-2">+{added.size} added</span>}
          </div>
          <button
            onClick={addAll}
            className="text-[9px] text-gray-600 hover:text-gray-400 cursor-pointer transition-colors"
          >
            accept all
          </button>
        </div>

        {/* Poet's selections */}
        <section>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">
            poet selects
          </div>
          <div className="space-y-0">
            {selections.map((s, i) => {
              const justAdded = added.has(s.sentence);
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-2.5 border-b border-gray-800/30 ${justAdded ? 'opacity-30' : ''}`}
                >
                  <button
                    onClick={() => addToPool(s.sentence)}
                    disabled={justAdded}
                    className="text-[10px] text-gray-700 hover:text-green-500 transition-colors cursor-pointer shrink-0 mt-0.5 disabled:cursor-default"
                  >
                    {justAdded ? '\u2713' : '+'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-gray-300 leading-[1.6]">{s.sentence}</div>
                    <div className="flex items-baseline gap-3 mt-1">
                      <span className={`text-[8px] ${s.author === 'kerem' ? 'text-gray-600' : 'text-blue-500/50'}`}>
                        {s.author}
                      </span>
                      <span className="text-[8px] text-gray-700">#{s.entryId}</span>
                      <span className="text-[8px] text-gray-700">{s.wordCount}w</span>
                      <span className="text-[8px] text-gray-700">{s.newWords} new words</span>
                      <span className="text-[8px] text-yellow-600/50">score {s.score.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Current pool */}
        <section className="mt-10">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">
            current pool ({pool.length})
          </div>
          <div className="space-y-0">
            {pool.map((s, i) => (
              <div key={i} className="flex items-start gap-3 py-1.5 border-b border-gray-800/20 opacity-40">
                <span className="text-[10px] text-green-600 shrink-0 mt-0.5">{'\u2713'}</span>
                <span className="text-[11px] text-gray-500 leading-[1.5]">{s}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
