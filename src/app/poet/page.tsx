'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { metalog, sources } from '@/lib/data';

function extractSentences(html: string): string[] {
  // Strip HTML tags
  const plain = html.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
  // Split by sentence boundaries
  return plain
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.length <= 120);
}

export default function PoetPage() {
  const [pool, setPool] = useState<Set<string>>(new Set(sources));
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'kerem' | 'architect'>('all');
  const [lengthSort, setLengthSort] = useState(false);

  // Extract all candidate sentences from metalog
  const candidates = useMemo(() => {
    const entries = filter === 'all' ? metalog : metalog.filter((e) => e.author === filter);
    const seen = new Set<string>();
    const result: { sentence: string; author: string; entryId: number }[] = [];

    for (const entry of entries) {
      const sentences = extractSentences(entry.comment);
      for (const s of sentences) {
        if (!seen.has(s)) {
          seen.add(s);
          result.push({ sentence: s, author: entry.author, entryId: entry.id });
        }
      }
    }

    if (lengthSort) {
      result.sort((a, b) => a.sentence.split(/\s+/).length - b.sentence.split(/\s+/).length);
    }

    return result;
  }, [filter, lengthSort]);

  const notInPool = candidates.filter((c) => !pool.has(c.sentence));
  const inPool = candidates.filter((c) => pool.has(c.sentence));

  async function addToPool(sentence: string) {
    try {
      const res = await fetch('/api/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence }),
      });
      if (res.ok) {
        setPool((prev) => new Set(prev).add(sentence));
        setAdded((prev) => new Set(prev).add(sentence));
      }
    } catch {
      // silent on public site
    }
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
        {/* Controls */}
        <div className="flex flex-wrap items-baseline gap-4 mb-6">
          <div className="flex gap-2 text-[10px]">
            {(['all', 'kerem', 'architect'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                  filter === f
                    ? 'bg-gray-800 text-gray-300'
                    : 'text-gray-600 hover:text-gray-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setLengthSort(!lengthSort)}
            className={`text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors ${
              lengthSort ? 'bg-gray-800 text-gray-300' : 'text-gray-600 hover:text-gray-400'
            }`}
          >
            sort by length
          </button>
          <div className="text-[9px] text-gray-600 ml-auto">
            {pool.size} in pool / {notInPool.length} candidates
            {added.size > 0 && <span className="text-green-500 ml-2">+{added.size} added</span>}
          </div>
        </div>

        {/* Candidates not in pool */}
        <section className="mb-8">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">
            candidates ({notInPool.length})
          </div>
          <div className="space-y-0">
            {notInPool.map((c, i) => {
              const wordCount = c.sentence.split(/\s+/).length;
              const justAdded = added.has(c.sentence);
              return (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-2 border-b border-gray-800/30 group ${justAdded ? 'opacity-40' : ''}`}
                >
                  <button
                    onClick={() => addToPool(c.sentence)}
                    disabled={justAdded}
                    className="text-[9px] text-gray-700 hover:text-green-500 transition-colors cursor-pointer shrink-0 mt-0.5 disabled:cursor-default"
                    title="add to source pool"
                  >
                    {justAdded ? '&#10003;' : '+'}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-gray-300 leading-[1.6]">{c.sentence}</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-[8px] ${c.author === 'kerem' ? 'text-gray-600' : 'text-blue-500/50'}`}>
                        {c.author}
                      </span>
                      <span className="text-[8px] text-gray-700">#{c.entryId}</span>
                      <span className="text-[8px] text-gray-700">{wordCount}w</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {notInPool.length === 0 && (
              <div className="text-[10px] text-gray-600 py-4">all sentences already in pool.</div>
            )}
          </div>
        </section>

        {/* Already in pool */}
        <section>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">
            in pool ({inPool.length})
          </div>
          <div className="space-y-0">
            {inPool.map((c, i) => {
              const wordCount = c.sentence.split(/\s+/).length;
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-800/30 opacity-40">
                  <span className="text-[9px] text-green-600 shrink-0 mt-0.5">&#10003;</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-gray-400 leading-[1.6]">{c.sentence}</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-[8px] ${c.author === 'kerem' ? 'text-gray-600' : 'text-blue-500/50'}`}>
                        {c.author}
                      </span>
                      <span className="text-[8px] text-gray-700">{wordCount}w</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
