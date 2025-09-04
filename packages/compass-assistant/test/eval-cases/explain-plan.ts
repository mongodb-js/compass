import type { SimpleEvalCase } from '../assistant.eval';

const explainPlanCases: SimpleEvalCase[] = [
  {
    input:
      'Explain this pipeline plan: $match { cuisine: "Italian" } then group by ' +
      'borough. Why is it slow and how to optimize?',
    expected: `The plan shows an IXSCAN on cuisine_-1, followed by a FETCH of full
documents because borough is not in the index. That causes 43,207 documents to
be read and grouped, taking about 1s. To avoid the FETCH and lower I/O, create
a compound index on { cuisine: 1, borough: 1 } (cuisine first). With a
compound index, queries that only filter on cuisine can still use the index
prefix, so a separate single-field index on cuisine is usually redundant.
Balance the benefits against index storage and write overhead before creating
it.`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/',
      'https://www.mongodb.com/docs/manual/reference/explain-results',
      'https://www.mongodb.com/docs/manual/faq/indexes',
      'https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/#std-label-esr-indexing-guideline',
      'https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/#index-prefixes',
    ],
  },
  {
    input:
      'Explain plan shows COLLSCAN on category = "low_rated" and ~1M docs ' +
      'examined. What should I do?',
    expected: `A COLLSCAN means the query read the entire collection to find matches,
which does not scale. Create an index on category so the planner can perform
an IXSCAN. Pros: much faster reads and better scalability. Cons: indexes add
storage and introduce write overhead because updates must maintain the index.
In Compass, open the collection, go to Indexes, click Create, add category,
and create the index. Re-run explain to confirm IXSCAN.`,
    expectedSources: [
      'https://www.mongodb.com/docs/manual/tutorial/analyze-query-plan/',
      'https://www.mongodb.com/docs/manual/reference/explain-results',
      'https://www.mongodb.com/docs/manual/faq/indexes',
    ],
  },
];

export default explainPlanCases;
