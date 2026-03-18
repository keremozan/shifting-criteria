'use client';

import Link from 'next/link';
import taxonomyData from '../../../data/taxonomy.json';
import rulebookHighlights from '../../../data/rulebook-highlights.json';
import PageHighlights from '@/components/PageHighlights';

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
    title: 'Every change stays visible',
    description: 'Nothing is silently replaced. When a term, rule, or definition changes, the old version remains in the document with a strikethrough. The new version appears alongside it. This applies to the rulebook, taxonomy, character descriptions, and any authored content. The history of decisions is part of the piece.',
  },
  {
    title: 'New rules apply forward only',
    description: 'Changes to terminology, taxonomy, editor behavior, or system rules apply to new generations only. Old snapshots, old metalog entries, and archived states keep their original language and formatting. The system does not rewrite its past.',
  },
  {
    title: 'Snapshots are archival',
    description: 'Saved snapshots preserve the exact state and language of their moment. New rules, taxonomy changes, and editor revisions do not retroactively alter them.',
  },
  {
    title: 'Viewer sessions are ephemeral',
    description: 'Each viewer starts at generation 0 with an empty document. Nothing persists to the server. Close the tab and the document is gone.',
  },
];

export default function RulebookPage() {
  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-6">
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

      <div className="flex gap-6 flex-1 relative" data-page-container="rulebook">
      <main className="flex-1 py-8 space-y-10 min-w-0">
        {/* Characters */}
        <section data-section-id="gen-entities">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">generation entities</div>
          <div className="space-y-3">
            {[
              { name: 'writer', color: '#9ca3af', role: 'Sources 1-2 sentences per generation from the pool. Prefers unused sentences. Does not generate language, only selects it.' },
              { name: 'checker', color: '#60a5fa', role: 'Evaluates every active fragment against three criteria: word count, repetition with other fragments, adjective count. Marks fragments that match.' },
              { name: 'cutter', color: '#f87171', role: 'Removes up to 2 fragments per generation. Targets fragments that are too old with no marks, have too many flags, or are too long. Prioritizes most-flagged, then oldest.' },
              { name: 'reader', color: '#fbbf24', role: 'Scans the document for patterns. Annotates survival (flagged but still active), echo (shared words), density (many active fragments), void (more removed than active).' },
              { name: 'narrator', color: '#a78bfa', role: 'Produces a plain-language summary of what happened during the generation. Sits between Reader and Logger in the pipeline.' },
              { name: 'logger', color: '#6b7280', role: 'Records operation counts and document statistics. Runs last.' },
            ].map((c: any) => (
              <div key={c.name} className="flex gap-3">
                <div className="flex items-center gap-1.5 shrink-0 w-20">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[11px] font-medium" style={{ color: c.color }}>{c.name}</span>
                </div>
                <div className="text-[10px] leading-relaxed">
                  {c.oldRole && (
                    <div className="text-gray-700 line-through mb-1">{c.oldRole}</div>
                  )}
                  <div className="text-gray-500">{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section data-section-id="observers">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">observers</div>
          <div className="space-y-3">
            {[
              { name: 'architect', color: '#60a5fa', role: 'Responds in the metalog when kerem says ASIDE. Discusses the system from outside it. Follows the no-AI-slop rule.' },
              { name: 'threads', color: '#f472b6', role: 'Groups metalog entries into conversation threads. Adds summaries, subtexts, and tags. Maintains the thread index.' },
              { name: 'editor', color: '#34d399', role: 'Revises display language from gen 4 onward. Strikes through "dead", "killed", "alive" and suggests replacements. Operates on presentation only.', oldRole: 'Revises display language from run 4 onward. Strikes through "dead", "killed", "alive" and suggests replacements. Operates on presentation only.' },
              { name: 'taxonomist', color: '#fb923c', role: 'Classifies system concepts and maintains the vocabulary. Determines how terms are displayed across contexts.', oldRole: 'Maintains the vocabulary file. Defines how terms are displayed across contexts. "Cycle" becomes "run", fragments get "c" prefix, headers get "#" prefix.' },
              { name: 'kerem', color: '#e5e7eb', role: 'The artist. Highlights and comments on the metalog and rulebook. These marks are visible to all viewers but only kerem can create them.' },
            ].map((c: any) => (
              <div key={c.name} className="flex gap-3">
                <div className="flex items-center gap-1.5 shrink-0 w-20">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[11px] font-medium" style={{ color: c.color }}>{c.name}</span>
                </div>
                <div className="text-[10px] leading-relaxed">
                  {c.oldRole && (
                    <div className="text-gray-700 line-through mb-1">{c.oldRole}</div>
                  )}
                  <div className="text-gray-500">{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section data-section-id="curators">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">curators</div>
          <div className="space-y-3">
            {[
              { name: 'poet', color: '#f9a8d4', role: 'Reads the metalog and selects sentences for the source pool. Scores candidates by length variety, word overlap, adjective density, and tone. Does not write. The gap between the metalog and the source pool is the poet\'s work.', oldRole: 'Kerem picks which sentences enter the source pool.' },
            ].map((c: any) => (
              <div key={c.name} className="flex gap-3">
                <div className="flex items-center gap-1.5 shrink-0 w-20">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-[11px] font-medium" style={{ color: c.color }}>{c.name}</span>
                </div>
                <div className="text-[10px] leading-relaxed">
                  {c.oldRole && (
                    <div className="text-gray-700 line-through mb-1">{c.oldRole}</div>
                  )}
                  <div className="text-gray-500">{c.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Taxonomy - active terms */}
        <section data-section-id="taxonomy">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">taxonomy</div>
          <div className="space-y-2">
            {Object.entries(tax).filter(([key]) => key !== '_deprecated').map(([key, val]: [string, any]) => (
              <div key={key} className="flex gap-3 text-[11px]">
                <span className="text-gray-400 font-medium shrink-0 w-28">{key}</span>
                <div className="text-gray-500">
                  {val.definition}
                  {val.replaces && (
                    <span className="text-gray-600 ml-1">(replaces &ldquo;{val.replaces}&rdquo;)</span>
                  )}
                  {val.example && (
                    <span className="text-gray-600 ml-1">e.g. {val.example}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Taxonomy - deprecated terms */}
        {tax._deprecated && (
          <section>
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">deprecated terms</div>
            <div className="space-y-2">
              {Object.entries(tax._deprecated).map(([key, val]: [string, any]) => (
                <div key={key} className="flex gap-3 text-[11px]">
                  <span className="text-gray-700 font-medium shrink-0 w-28 line-through">{key}</span>
                  <div>
                    <div className="text-gray-700 line-through">{val.definition}</div>
                    <div className="text-gray-600 text-[10px] mt-0.5">
                      superseded by <span className="text-gray-400">{val.supersededBy}</span>. {val.reason}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rules */}
        <section data-section-id="rules">
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

      <PageHighlights pageKey="rulebook" authorHighlights={rulebookHighlights as any[]} />
      </div>
    </div>
  );
}
