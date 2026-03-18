'use client';

import type { Fragment } from '@/lib/types';
import FragmentView from './FragmentView';

interface Props {
  fragments: Fragment[];
  currentCycle: number;
}

export default function DocumentView({ fragments, currentCycle }: Props) {
  if (fragments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600 text-sm">
        no fragments yet. run a cycle.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {fragments.map((fragment) => (
        <FragmentView key={fragment.id} fragment={fragment} currentCycle={currentCycle} />
      ))}
    </div>
  );
}
