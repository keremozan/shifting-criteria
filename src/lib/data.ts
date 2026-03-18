import type { MetalogEntry } from './metalog';

import metalogData from '../../data/metalog.json';
import threadsData from '../../data/metalog-threads.json';
import highlightsData from '../../data/highlights.json';
import diagramsData from '../../data/diagrams.json';
import sourcesData from '../../data/sources.json';
import snapshotsData from '../../data/snapshots.json';

export interface Thread {
  id: number;
  startEntry: number;
  endEntry: number;
  summary: string;
  subtext?: string;
  tags: string[];
}

export interface AuthorHighlight {
  id: string;
  text: string;
  color: string;
  bg: string;
  entryId: number;
  startOffset: number;
  endOffset: number;
  comments: { id: string; text: string; timestamp: number }[];
}

export interface Diagram {
  id: number;
  title: string;
  date: string;
  time: string;
  metalogEntryId?: number;
  type?: 'ascii' | 'html';
  content?: string;
  html?: string;
}

export interface Snapshot {
  id: string;
  date: string;
  time: string;
  cycle: number;
  alive: number;
  dead: number;
  state: any;
}

export const metalog: MetalogEntry[] = metalogData as MetalogEntry[];
export const threads: Thread[] = threadsData as Thread[];
export const authorHighlights: AuthorHighlight[] = highlightsData as AuthorHighlight[];
export const diagrams: Diagram[] = diagramsData as Diagram[];
export const sources: string[] = sourcesData as string[];
export const snapshots: Snapshot[] = snapshotsData as Snapshot[];
