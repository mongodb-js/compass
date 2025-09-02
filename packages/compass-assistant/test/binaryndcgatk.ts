import { strict as assert } from 'assert';

type MatchFunc<T> = (expected: T, actual: T) => boolean;

type Primitive = string | number | boolean | null | undefined;

const assertKIsValid = (k: number) =>
  assert(k > 0 && Number.isInteger(k), 'k must be a positive integer');

/**
  Taken from https://github.com/mongodb/chatbot/blob/004a61464c2c25d6b61ad943d1ad9b2fc934eb73/packages/mongodb-rag-core/src/eval/retrievalMetrics/binaryNdcgAtK.ts#L17
  
  Calculate binary Normalized Discounted Cumulative Gain (NDCG) at rank K.
  NDCG is a measure of ranking quality that evaluates how well the retrieved
  results are ordered by relevance, considering the position of each result.
  For binary relevance (relevant or not relevant), relevance scores are 1 or 0.

  @param relevantItems - List of expected relevant items (all with relevance score 1).
  @param retrievedItems - List of retrieved items to evaluate.
  @param matchFunc - Function to compare items for equality.
  @param k - Cutoff rank (top-k results to consider).
  @returns Binary NDCG at rank K.
 */
export function binaryNdcgAtK<T extends Primitive>(
  relevantItems: T[],
  retrievedItems: T[],
  matchFunc: MatchFunc<T>,
  k: number
): number {
  assertKIsValid(k);

  const limit = Math.min(k, retrievedItems.length);

  const deduplicatedRetrievedItems = removeDuplicates(retrievedItems, limit);

  const relevanceScores = calculateRelevanceScores(
    deduplicatedRetrievedItems,
    relevantItems,
    matchFunc
  );

  // Use the ndcg function to calculate NDCG
  return ndcg(relevanceScores, relevantItems.length, k);
}

function removeDuplicates<T extends Primitive>(
  items: T[],
  limit: number
): (T | null)[] {
  const itemsInLimit = items.slice(0, limit);
  const seen = new Set<T>();
  return itemsInLimit.map((item) => {
    if (seen.has(item)) {
      return null;
    } else {
      seen.add(item);
      return item;
    }
  });
}

function calculateRelevanceScores<T extends Primitive>(
  retrievedItems: (T | null)[],
  relevantItems: T[],
  matchFunc: MatchFunc<T>
): number[] {
  return retrievedItems.map((item) => {
    // handle duplicate items
    if (item === null) {
      return 0;
    }
    return relevantItems.some((relevantItem) => matchFunc(relevantItem, item))
      ? 1
      : 0;
  });
}

/**
  Normalized Discounted Cumulative Gain (NDCG)
 */
export function ndcg(realScores: number[], idealNum: number, k: number) {
  const actualDcg = dcg(realScores);
  const idealDcg = dcg(ideal(idealNum, k));
  return idealDcg === 0 ? 0 : actualDcg / idealDcg;
}

function dcg(scores: number[]) {
  return scores.reduce((sum, gain, i) => sum + gain / Math.log2(i + 2), 0);
}

function ideal(n: number, k: number) {
  return Array.from({ length: k }, (_, i) => (i < n ? 1 : 0));
}
