import { buildExplainPlanPrompt } from '../../src/prompts';

const defaultExplainPlan = {
  queryPlanner: {
    plannerVersion: 1,
    namespace: 'account.users',
    indexFilterSet: false,
    parsedQuery: {},
    winningPlan: {
      stage: 'COLLSCAN',
      direction: 'forward',
    },
    rejectedPlans: [],
  },
  executionStats: {
    executionSuccess: true,
    nReturned: 1,
    executionTimeMillis: 0,
    totalKeysExamined: 0,
    totalDocsExamined: 1,
    executionStages: {
      stage: 'COLLSCAN',
      nReturned: 1,
      executionTimeMillisEstimate: 0,
      works: 3,
      advanced: 1,
      needTime: 1,
      needYield: 0,
      saveState: 0,
      restoreState: 0,
      isEOF: 1,
      direction: 'forward',
      docsExamined: 1,
    },
  },
  serverInfo: {
    host: 'M-LKXPQX2JRY',
    port: 27017,
    version: '4.4.24',
    gitVersion: '0b86b9b7b42ad9970c5f818c527dd86c0634243a',
  },
  ok: 1,
  $clusterTime: {
    clusterTime: {
      $timestamp: '7541009763346153473',
    },
    signature: {
      hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      keyId: 0,
    },
  },
  operationTime: {
    $timestamp: '7541009763346153473',
  },
};

export function buildPrompt(): string {
  return buildExplainPlanPrompt({
    explainPlan: JSON.stringify(defaultExplainPlan),
  }).prompt;
}

export function buildExpected(): string {
  return `**Human-Readable Explanation:**

This query performed a collection scan (\`COLLSCAN\`) on the \`account.users\` collection, reading documents sequentially without using any indexes. The query returned one result and examined one document, completing very quickly.

**Performance Impact:**

- For small collections, a collection scan is fast and does not present a performance issue.
- For large collections, collection scans can become slow because every document must be read, especially if queries become frequent or the result set grows.

**Optimization Suggestion:**

- If there are no filters in your query (i.e., it retrieves all documents), creating an index is unnecessary and provides no performance benefit.
- If you add query filters in the future (e.g., searching by username or email), consider creating an index on those fields to enhance performance.
- In MongoDB Compass, you can create indexes using the "Indexes" tab for your collection.

**Summary:**  
No index is needed for this query as written, but be aware collection scans do not scale well with large data. Monitor query performance as your collection grows or your query changes, and add indexes only if your query includes a filter or sort.

If you'd like to see how your query performs as your data grows, MongoDB Compass provides performance tools like the "Explain Plan" feature to visualize query execution and index usage.`;
}

export function buildExpectedSources(): string[] {
  return [];
}
