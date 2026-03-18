'use client';

import Link from 'next/link';
import taxonomyData from '../../../data/taxonomy.json';

const tax = taxonomyData as Record<string, any>;

const SYSTEM_RULES = [
  {
    title: 'Cycle entities run in strict order',
    description: 'Writer, Checker, Cutter, Reader, Narrator, Logger. Each run executes all six in sequence.',
  },
  {
    title: 'Writer sources 1-2 fragments per run',
    description: 'Sentences pulled from data/sources.json. Prefers unused sentences. Once all are used, recycles.',
  },
  {
    title: 'Checker evaluates three criteria',
    description: 'Word count (flag if above threshold), repetition (highlight if shares words with another fragment), adjectives (value-tag if contains adjectives).',
  },
  {
    title: 'Criteria shift every 5 runs',
    description: 'One threshold moves by +1 or -1, minimum 1. Which criterion shifts rotates through the three.',
  },
  {
    title: 'Cutter removes up to 2 fragments per run',
    description: 'Targets: fragments older than 3 runs with zero marks, fragments with 2+ flags, fragments longer than 8 words. Prioritizes most-flagged, then oldest.',
  },
  {
    title: 'Reader annotates patterns',
    description: 'Survival (flagged but still active), echo (two fragments share 3+ words), density (more than 10 active fragments), void (more removed than active).',
  },
  {
    title: 'Editor revises display language from run 4 onward',
    description: 'Strikes through "dead", "killed", "alive" and suggests "removed", "active". Operates on presentation only. Underlying data unchanged.',
  },
  {
    title: 'Snapshots are archival',
    description: 'Saved snapshots preserve the exact state and language of their moment. New rules, taxonomy changes, and editor revisions do not retroactively alter them.',
  },
  {
    title: 'Viewer sessions are ephemeral',
    description: 'Each viewer starts at run 0 with an empty document. Nothing persists to the server. Close the tab and the document is gone.',
  },
];

export default function RulebookPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto px-6">
      <header className="flex items-baseline justify-between py-5 border-b border-gray-800">
        <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
          rulebook
        </h1>
        <Link
          href="/"
          className="text-[10px] text-gray-500 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors"
        >
          back
        </Link>
      </header>

      <main className="flex-1 py-8 space-y-8">
        {/* Taxonomy */}
        <section>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">taxonomy</div>
          <div className="space-y-2">
            {Object.entries(tax).map(([key, val]: [string, any]) => (
              <div key={key} className="flex gap-3 text-[11px]">
                <span className="text-gray-400 font-medium shrink-0 w-24">{key}</span>
                <span className="text-gray-500">
                  {val.definition}
                  {val.replaces && (
                    <span className="text-gray-600 ml-2">(replaces &ldquo;{val.replaces}&rdquo;)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Rules */}
        <section>
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">rules</div>
          <div className="space-y-3">
            {SYSTEM_RULES.map((rule, i) => (
              <div key={i} className="border-l border-gray-800 pl-3">
                <div className="text-[11px] text-gray-300 font-medium">{rule.title}</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">{rule.description}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
