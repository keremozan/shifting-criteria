// The poet reads the metalog and selects sentences for the source pool.
// Does not write. Scores by how much a candidate would change the pool's distribution.

interface PoolStats {
  avgLength: number;
  lengths: number[];
  words: Set<string>;
  adjCount: number;
  total: number;
}

const ADJECTIVES = ['open', 'closed', 'partial', 'broken', 'new', 'prior', 'inner', 'outer',
  'abstract', 'empty', 'ugly', 'real', 'formal', 'dramatic', 'old', 'conceptual'];

function getWords(s: string): string[] {
  return s.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(Boolean);
}

function countAdj(words: string[]): number {
  return words.filter((w) => ADJECTIVES.includes(w)).length;
}

function poolStats(pool: string[]): PoolStats {
  const lengths = pool.map((s) => getWords(s).length);
  const allWords = new Set<string>();
  let adjCount = 0;
  for (const s of pool) {
    const w = getWords(s);
    w.forEach((word) => allWords.add(word));
    adjCount += countAdj(w);
  }
  return {
    avgLength: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0,
    lengths,
    words: allWords,
    adjCount,
    total: pool.length,
  };
}

function scoreSentence(sentence: string, stats: PoolStats): number {
  const words = getWords(sentence);
  const len = words.length;
  let score = 0;

  // Length variety: reward sentences that are far from the average length
  const lengthDiff = Math.abs(len - stats.avgLength);
  score += lengthDiff * 2;

  // New words: reward sentences that introduce vocabulary not in the pool
  const newWords = words.filter((w) => !stats.words.has(w)).length;
  score += newWords * 3;

  // Overlap: also reward some shared words (creates checker triggers)
  const sharedWords = words.filter((w) => stats.words.has(w)).length;
  score += Math.min(sharedWords, 3);

  // Adjective balance: reward if pool is low on adjectives, penalize if heavy
  const adj = countAdj(words);
  const adjRatio = stats.total > 0 ? stats.adjCount / stats.total : 0;
  if (adjRatio < 0.3 && adj > 0) score += 2;
  if (adjRatio > 0.7 && adj > 0) score -= 1;

  // Short sentences get a small bonus (more likely to survive the cutter)
  if (len <= 5) score += 1;

  return score;
}

function extractSentences(html: string): string[] {
  const plain = html.replace(/<[^>]+>/g, '').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
  return plain
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8 && s.length <= 120);
}

export interface PoetSelection {
  sentence: string;
  score: number;
  author: string;
  entryId: number;
  newWords: number;
  wordCount: number;
}

export function poetSelect(
  metalog: { id: number; author: string; comment: string }[],
  currentPool: string[],
  count: number = 10
): PoetSelection[] {
  const stats = poolStats(currentPool);
  const poolSet = new Set(currentPool);
  const seen = new Set<string>();
  const candidates: PoetSelection[] = [];

  for (const entry of metalog) {
    const sentences = extractSentences(entry.comment);
    for (const s of sentences) {
      if (poolSet.has(s) || seen.has(s)) continue;
      seen.add(s);

      const words = getWords(s);
      const newWords = words.filter((w) => !stats.words.has(w)).length;

      candidates.push({
        sentence: s,
        score: scoreSentence(s, stats),
        author: entry.author,
        entryId: entry.id,
        newWords,
        wordCount: words.length,
      });
    }
  }

  // Sort by score descending, return top N
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, count);
}
