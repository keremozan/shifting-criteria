import taxonomyData from '../../data/taxonomy.json';

const tax = taxonomyData as Record<string, any>;

// Format a run number for display in a given context
export function fmtRun(n: number, context: 'header' | 'narrative' | 'snapshot' | 'fragment' = 'header'): string {
  const prefix = tax.run?.display?.[context] || '#';
  return `${prefix}${n}`;
}

// Get the correct term for a concept
export function term(key: string): string {
  return tax[key]?.definition || key;
}

// Get display replacement for legacy terms
export function replaceLegacy(text: string): string {
  let result = text;
  // Replace "alive" with "active" in display
  result = result.replace(/\balive\b/gi, (m) => m[0] === 'A' ? 'Active' : 'active');
  // Replace "dead" with "removed"
  result = result.replace(/\bdead\b/gi, (m) => m[0] === 'D' ? 'Removed' : 'removed');
  // Replace "cycle N" with "#N" (but not "c3" fragment labels)
  result = result.replace(/\bcycle (\d+)/gi, '#$1');
  return result;
}
