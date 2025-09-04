import type { SimpleEvalCase } from '../assistant.eval';

const atlasSearchCases: SimpleEvalCase[] = [
  {
    input: 'How can I filter docs before running a $search query?',
    expected: `The $search stage must be first in the pipeline, so you cannot
pre-filter with a preceding $match. Instead, add filtering to your $search
using the compound operator's filter clause to narrow the dataset.
Alternatively, build a View that pre-filters documents (requires
createCollection privileges).`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/compound/#options',
      'https://www.mongodb.com/docs/atlas/atlas-search/transform-documents-collections/#example--filter-documents',
    ],
  },
  {
    input: 'What is the $search stage?',
    expected: `$search is part of Atlas Search and integrates with aggregation as the
first stage. It supports full-text and rich search expressions over text,
numeric, date, and more, and works with subsequent pipeline stages for
transformation.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/#what-is-fts-',
    ],
  },
  {
    input: 'Can $search work with regular MongoDB indexes?',
    expected: `No. $search requires an Atlas Search Index. Standard MongoDB indexes are
not used by $search operations.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/index-definitions/#index-reference',
    ],
  },
  {
    input: 'How do I sort $search results?',
    expected: `Use the sort parameter inside $search. Numeric, date, ObjectId, boolean,
and UUID types support sorting directly. For strings, map the field as token
in the Atlas Search Index to enable proper sorting.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/sort/#sort-fts-results',
    ],
  },
  {
    input: 'What is token type mapping in Atlas Search and why use it?',
    expected: `Mapping a field as token indexes it as a single term with no tokenization
or lowercasing. This is useful for sorting, faceting, and exact matching on
strings. If you need case-insensitive behavior, apply a lowercase normalizer.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/field-types/token-type/#how-to-index-string-fields-for-efficient-sorting-and-faceting',
    ],
  },
  {
    input: 'Can I add fuzzy matching to $search?',
    expected: `Yes. In a text or autocomplete query, add a fuzzy object with maxEdits to
allow close matches (insertions, deletions, substitutions). Example: set
maxEdits: 2 to tolerate up to two single-character edits.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/text/#text-operator',
    ],
  },
  {
    input: 'How do I combine multiple conditions in one $search query?',
    expected: `Use the compound operator. must is an AND, should boosts relevancy for
preferred matches, and filter applies constraints without affecting score.
You can mix text queries with range filters for dates or numbers.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/compound/#compound-operator',
    ],
  },
  {
    input: 'Does $search support wildcard or regex?',
    expected: `Yes. Use wildcard for simple patterns with * and ?. Use regex for
Lucene-style regular expressions. For substring search at scale, prefer
autocomplete, weighing performance vs. storage tradeoffs.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/wildcard/#wildcard-operator',
    ],
  },
  {
    input: 'How can I highlight matched terms in $search results?',
    expected: `Add a highlight object to $search and specify the field path. Results
include a highlights array with snippets and <em> tags around matched terms.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/highlighting/#highlight-search-terms-in-results',
    ],
  },
  {
    input: 'What is the difference between $search and $searchMeta?',
    expected: `$search returns matching documents. $searchMeta returns only metadata
such as total counts or facets. If you need both docs and metadata, you can
read $$SEARCH_META in a later stage after $search.`,
    expectedSources: [
      'https://www.mongodb.com/docs/atlas/atlas-search/query-syntax/#choose-the-aggregation-pipeline-stage',
    ],
  },
];

export default atlasSearchCases;
