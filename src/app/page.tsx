'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SystemState, EntityId } from '@/lib/types';
import { sources } from '@/lib/data';
import { runCycle } from '@/lib/engine';
import DocumentView from '@/components/DocumentView';
import EntityPanel from '@/components/EntityPanel';
import SystemLog from '@/components/SystemLog';
import { editorRevise } from '@/lib/editor';

const ENTITY_ORDER: EntityId[] = ['writer', 'checker', 'cutter', 'reader', 'narrator', 'logger'];

function createBlankState(): SystemState {
  return {
    cycle: 0,
    document: [],
    entities: {
      writer: { id: 'writer', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      checker: { id: 'checker', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      cutter: { id: 'cutter', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      logger: { id: 'logger', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      reader: { id: 'reader', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
      narrator: { id: 'narrator', cycle: 0, internalLog: [], rules: {}, vocabulary: [] },
    },
    criteria: { current: [], history: [] },
    log: [],
    narrative: [],
  };
}

export default function Home() {
  const [state, setState] = useState<SystemState>(createBlankState);

  const handleCycle = () => {
    setState((prev) => runCycle(prev, sources));
  };

  const aliveCount = state.document.filter((f) => f.alive).length;
  const deadCount = state.document.filter((f) => !f.alive).length;

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4">
      {/* Header */}
      <header className="py-4 border-b border-gray-800 space-y-2">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-4">
            <h1 className="text-[11px] text-gray-500 tracking-[0.15em] uppercase">
              ETSC
            </h1>
            <span
              className="text-[10px] text-gray-600"
              dangerouslySetInnerHTML={{
                __html: editorRevise(`${aliveCount} alive / ${deadCount} dead`, state.cycle)
              }}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-gray-500">
              cycle {state.cycle}
            </span>
            <button
              onClick={handleCycle}
              className="text-[10px] text-gray-400 border border-gray-700 px-2 py-0.5 rounded hover:bg-gray-900 hover:text-gray-300 transition-colors cursor-pointer"
            >
              &#9654; cycle
            </button>
          </div>
        </div>
        <nav className="flex items-baseline gap-4 text-[10px]">
          <span className="text-gray-600">system</span>
          <Link href="/snapshots" className="text-gray-500 hover:text-gray-300 transition-colors">snapshots</Link>
          <Link href="/changelog" className="text-gray-500 hover:text-gray-300 transition-colors">changelog</Link>
          <span className="text-gray-700">|</span>
          <span className="text-gray-600">meta</span>
          <Link href="/metalog" className="text-gray-500 hover:text-gray-300 transition-colors">metalog</Link>
          <Link href="/diagrams" className="text-gray-500 hover:text-gray-300 transition-colors">diagrams</Link>
          <span className="text-gray-700">|</span>
          <Link href="/about" className="text-gray-500 hover:text-gray-300 transition-colors">about</Link>
        </nav>
      </header>

      {/* Narrative */}
      {state.narrative && state.narrative.length > 0 && (
        <div className="py-3 border-b border-gray-800">
          <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-1.5">
            cycle {state.cycle}
          </div>
          <div className="space-y-0.5">
            {state.narrative.map((line, i) => (
              <div key={i} className="text-[11px] text-gray-400 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: editorRevise(line, state.cycle) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Criteria */}
      <div className="py-2 border-b border-gray-800">
        <span className="text-[9px] text-gray-600 uppercase tracking-wider mr-3">
          active criteria
        </span>
        {(() => {
          const thresholds = state.entities.checker?.rules?.criteriaThresholds as Record<string, number> | undefined;
          if (!thresholds || Object.keys(thresholds).length === 0) {
            return <span className="text-[10px] text-gray-600">none yet (run a cycle)</span>;
          }
          const descriptions: Record<string, string> = {
            wordCount: 'flag if words',
            repetition: 'highlight if shared words',
            hasAdjective: 'value if adjectives',
          };
          return Object.entries(thresholds).map(([name, val]) => (
            <span key={name} className="text-[10px] text-gray-500 mr-4">
              {descriptions[name] || name} &gt;{val}
            </span>
          ));
        })()}
        {state.criteria.history.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {state.criteria.history.map((h, i) => {
              const desc = h.criteria.map((c) => {
                const match = c.match(/(\w+) threshold: (\d+).(\d+)/);
                if (!match) return c;
                const [, name, from, to] = match;
                const dir = Number(to) > Number(from) ? 'loosened' : 'tightened';
                return `${name} ${dir} from ${from} to ${to}`;
              });
              return (
                <div key={i} className="text-[10px] text-gray-500">
                  <span className="text-gray-600">cycle {h.cycle}:</span>{' '}
                  {desc.join(', ')}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document */}
      <main className="flex-1 py-4 min-h-[40vh] overflow-y-auto">
        <DocumentView fragments={state.document} currentCycle={state.cycle} />
      </main>

      {/* Agents */}
      <section className="border-t border-gray-800 py-4">
        <div className="flex gap-8">
          <div className="flex-1">
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">cycle</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {ENTITY_ORDER.map((id) => {
                const entity = state.entities[id];
                return entity ? <EntityPanel key={id} entity={entity} /> : null;
              })}
            </div>
          </div>
          <div className="w-px bg-gray-800" />
          <div>
            <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-3">observers</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { name: 'threads', color: '#f472b6' },
                { name: 'editor', color: '#34d399' },
                { name: 'kerem', color: '#e5e7eb' },
              ].map((o) => (
                <div key={o.name} className="flex items-center gap-1.5 py-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: o.color }} />
                  <span className="text-[11px]" style={{ color: o.color }}>{o.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* System log */}
      <section className="border-t border-gray-800 py-3 mb-4">
        <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">
          log
        </div>
        <SystemLog entries={state.log} />
      </section>
    </div>
  );
}
