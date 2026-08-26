import Fuse from 'fuse.js';
import type { GoToCandidate } from './go-to-candidates';

const DEFAULT_LIMIT = 20;

/**
 * Fuzzy-ranks go-to candidates with Fuse.js, then applies prefix/exact boosts
 * on the primary label (and qualified namespace for nested items). Returns at
 * most `limit` results. Empty query returns the first `limit` candidates in
 * inventory order.
 */
export function rankGoToResults(
  candidates: readonly GoToCandidate[],
  query: string,
  limit = DEFAULT_LIMIT
): GoToCandidate[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return candidates.slice(0, limit);
  }

  const fuse = new Fuse(candidates, {
    includeScore: true,
    ignoreLocation: true,
    threshold: 0.4,
    keys: [
      { name: 'primary', weight: 0.7 },
      { name: 'namespace', weight: 0.2 },
      { name: 'secondary', weight: 0.1 },
    ],
  });

  const needle = trimmed.toLowerCase();

  return fuse
    .search(trimmed)
    .map((result) => ({
      candidate: result.item,
      score: boostedScore(result.item, needle, result.score ?? 1),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((r) => r.candidate);
}

function boostedScore(
  candidate: GoToCandidate,
  needle: string,
  fuseScore: number
): number {
  let score = fuseScore;
  const primary = candidate.primary.toLowerCase();
  const namespace = candidate.namespace?.toLowerCase() ?? '';

  if (primary === needle || namespace === needle) {
    score -= 1;
  } else if (primary.startsWith(needle) || namespace.startsWith(needle)) {
    score -= 0.5;
  }

  return score;
}
