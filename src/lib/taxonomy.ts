import taxonomyData from '../../data/taxonomy.json';

const tax = taxonomyData as Record<string, any>;

export function fmtGen(n: number, active: number, removed: number): string {
  const prefix = tax.generation?.display?.header || 'gen-';
  return `${prefix}${n}:${active}a:${removed}r`;
}

export function fmtGenShort(n: number, context: 'header' | 'narrative' | 'snapshot' | 'fragment' = 'header'): string {
  const prefix = tax.generation?.display?.[context] || 'gen-';
  return `${prefix}${n}`;
}

// Keep old fmtRun as alias during transition
export function fmtRun(n: number, context: 'header' | 'narrative' | 'snapshot' | 'fragment' = 'header'): string {
  return fmtGenShort(n, context);
}
