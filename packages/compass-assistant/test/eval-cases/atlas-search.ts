import type { SimpleEvalCase } from '../assistant.eval';

export const atlasSearchEvalCases: SimpleEvalCase[] = [
  {
    input: 'How can I filter docs before running a $search query?',
    expected:
      'Because the $search stage must be the first stage in an aggregation pipeline, you cannot pre-filter documents with a preceding $match stage. Instead, filtering should be performed within the $search stage using the filter clause of the compound operator. This allows you to apply predicate queries (e.g., on ranges, dates, or specific terms) to narrow down the dataset before the main query clauses (must or should) are executed. Alternatively, you can filter documents by creating a View—a partial index of your collection that pre-queries and filters out unwanted documents. Note that users need createCollection privileges to build views.',
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/compound/#options',
      'https://www.mongodb.com/docs/atlas/atlas-search/transform-documents-collections/#example--filter-documents',
    ],
  },
];
