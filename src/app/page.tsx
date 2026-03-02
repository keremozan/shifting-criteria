'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SystemState, EntityId } from '@/lib/types';
import DocumentView from '@/components/DocumentView';
import EntityPanel from '@/components/EntityPanel';
import SystemLog from '@/components/SystemLog';

const ENTITY_ORDER: EntityId[] = ['writer', 'checker', 'cutter', 'reader', 'logger'];

export default function Home() {
  const [state, setState] = useState<SystemState | null>(null);
  const [running, setRunning] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/cycle');
      if (res.ok) {
        const data: SystemState = await res.json();
        setState(data);
      }
    } catch {
      // silent
    }
  }, []);

  // Initial load + polling
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const runCycle = async () => {
    setRunning(true);
    try {
      await fetch('/api/cycle', { method: 'POST' });
      await fetchState();
    } catch {
      // silent
    } finally {
      setRunning(false);
    }
  };

  const aliveCount = state?.document.filter((f) => f.alive).length ?? 0;
  const deadCount = state?.document.filter((f) => !f.alive).length ?? 0;

  return (
    <div className="min-h-screen flex flex-col max-w-4xl mx-auto px-4">
      {/* Header */}
      <header className="flex items-baseline justify-between py-4 border-b border-gray-900">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xs text-gray-500 tracking-wide uppercase">
            ETSC
          </h1>
          <span className="text-[10px] text-gray-700">
            fragments: {aliveCount} alive / {deadCount} dead
          </span>
        </div>
        <div className="flex items-baseline gap-4">
          <span className="text-[10px] text-gray-600">
            cycle: {state?.cycle ?? 0}
          </span>
          <button
            onClick={runCycle}
            disabled={running}
            className="text-[10px] text-gray-400 border border-gray-800 px-2 py-0.5 hover:bg-gray-900 hover:text-gray-200 disabled:opacity-30 transition-colors cursor-pointer"
          >
            {running ? '...' : '\u25B6 cycle'}
          </button>
        </div>
      </header>

      {/* Criteria */}
      {state?.criteria.current && state.criteria.current.length > 0 && (
        <div className="py-2 border-b border-gray-900">
          <span className="text-[9px] text-gray-700 uppercase tracking-wider mr-2">
            criteria
          </span>
          {state.criteria.current.map((c, i) => (
            <span key={i} className="text-[10px] text-gray-500 mr-3">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Document */}
      <main className="flex-1 py-4 min-h-[40vh] overflow-y-auto">
        <DocumentView fragments={state?.document ?? []} />
      </main>

      {/* Entity panels */}
      <section className="border-t border-gray-900 py-3">
        <div className="text-[9px] text-gray-700 uppercase tracking-wider mb-2">
          entities
        </div>
        <div className="grid grid-cols-5 gap-1">
          {state &&
            ENTITY_ORDER.map((id) => (
              <EntityPanel key={id} entity={state.entities[id]} />
            ))}
        </div>
      </section>

      {/* System log */}
      <section className="border-t border-gray-900 py-3 mb-4">
        <div className="text-[9px] text-gray-700 uppercase tracking-wider mb-2">
          log
        </div>
        <SystemLog entries={state?.log ?? []} />
      </section>
    </div>
  );
}
