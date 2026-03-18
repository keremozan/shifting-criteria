// The Editor agent. Transforms presentation language without changing system data.
// Only applies to cycles after a threshold. Archival cycles keep original wording.

export const EDITOR_ACTIVE_FROM_CYCLE = 4; // cycles before this keep original language

interface Replacement {
  original: string;
  replacement: string;
  pattern: RegExp;
}

const REPLACEMENTS: Replacement[] = [
  { original: 'dead', replacement: 'removed', pattern: /\bdead\b/gi },
  { original: 'killed', replacement: 'removed', pattern: /\bkilled\b/gi },
  { original: 'kill', replacement: 'remove', pattern: /\bkill\b/gi },
  { original: 'kills', replacement: 'removes', pattern: /\bkills\b/gi },
  { original: 'alive', replacement: 'active', pattern: /\balive\b/gi },
  { original: 'dies', replacement: 'expires', pattern: /\bdies\b/gi },
  { original: 'die', replacement: 'expire', pattern: /\bdie\b/gi },
  { original: 'death', replacement: 'removal', pattern: /\bdeath\b/gi },
];

// Returns edited text with strikethrough originals and suggested replacements
export function editorRevise(text: string, cycle: number): string {
  if (cycle < EDITOR_ACTIVE_FROM_CYCLE) return text;

  let result = text;
  for (const r of REPLACEMENTS) {
    result = result.replace(r.pattern, (match) => {
      // Preserve original casing for the replacement
      const isUpper = match[0] === match[0].toUpperCase();
      const rep = isUpper
        ? r.replacement[0].toUpperCase() + r.replacement.slice(1)
        : r.replacement;
      return `<span class="editor-revision"><s class="editor-original">${match}</s> ${rep}</span>`;
    });
  }
  return result;
}

// Simple version that just replaces without showing the original
export function editorClean(text: string, cycle: number): string {
  if (cycle < EDITOR_ACTIVE_FROM_CYCLE) return text;

  let result = text;
  for (const r of REPLACEMENTS) {
    result = result.replace(r.pattern, (match) => {
      const isUpper = match[0] === match[0].toUpperCase();
      return isUpper
        ? r.replacement[0].toUpperCase() + r.replacement.slice(1)
        : r.replacement;
    });
  }
  return result;
}
