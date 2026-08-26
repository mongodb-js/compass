import Fuse from 'fuse.js';
import type { GoToCandidate } from './go-to-candidates';

const DEFAULT_LIMIT = 20;

const FUSE_OPTIONS: Fuse.IFuseOptions<GoToCandidate> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.4,
  keys: [
    { name: 'primary', weight: 0.7 },
    { name: 'namespace', weight: 0.2 },
    { name: 'secondary', weight: 0.1 },
  ],
};

/**
 * Builds a searcher that reuses one Fuse index for the given candidates.
 * Empty / whitespace-only queries return no rows (empty-state recents are #3).
 */
export function createGoToSearcher(
  candidates: readonly GoToCandidate[],
  limit = DEFAULT_LIMIT
): (query: string) => GoToCandidate[] {
  const fuse = new Fuse([...candidates], FUSE_OPTIONS);

  return (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

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
  };
}

/**
 * Fuzzy-ranks go-to candidates with Fuse.js, then applies prefix/exact boosts
 * on the primary label (and qualified namespace for nested items). Returns at
 * most `limit` results. Empty query returns no rows until empty-state recents.
 */
export function rankGoToResults(
  candidates: readonly GoToCandidate[],
  query: string,
  limit = DEFAULT_LIMIT
): GoToCandidate[] {
  return createGoToSearcher(candidates, limit)(query);
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
