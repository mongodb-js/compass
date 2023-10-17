import React from 'react';
import type { Signal } from './signal-popover';

const SIGNALS = [
  {
    id: 'aggregation-executed-without-index',
    title: 'Aggregation executed without index',
    description: (
      <>
        This aggregation ran without an index. If you plan on using this query{' '}
        <strong>heavily</strong> in your application, you should create an index
        that covers this aggregation.
      </>
    ),
    learnMoreLink:
      'https://www.mongodb.com/docs/v6.0/core/data-model-operations/#indexes',
    primaryActionButtonLabel: 'Create index',
    primaryActionButtonIcon: 'Plus',
  },
  {
    id: 'atlas-text-regex-usage-in-view',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Convert your view’s query to $search for a wider range of functionality.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLink: 'https://www.mongodb.com/cloud/atlas/lp/search-1',
    primaryActionButtonLabel: 'Try Atlas Search',
  },
  {
    id: 'non-atlas-text-regex-usage-in-view',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Connect with Atlas to explore the power of Atlas Search.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLink: 'https://www.mongodb.com/cloud/atlas/lp/search-1',
    primaryActionButtonLabel: 'Try Atlas Search',
  },
  {
    id: 'lookup-in-view',
    title: '$lookup usage',
    description:
      '$lookup operations can be resource-intensive because they perform operations on two collections instead of one. In certain situations, embedding documents or arrays can enhance read performance.',
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/schema-suggestions/reduce-lookup-operations/#std-label-anti-pattern-denormalization',
  },
  {
    id: 'atlas-with-search-text-regex-usage-in-stage',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Convert your query to $search for a wider range of functionality.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLabel: 'Create Search Index',
  },
  {
    id: 'atlas-without-search-text-regex-usage-in-stage',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Convert your query to $search for a wider range of functionality.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLink: 'https://www.mongodb.com/cloud/atlas/lp/search-1',
    primaryActionButtonLabel: 'Try Atlas Search',
  },
  {
    id: 'non-atlas-text-regex-usage-in-stage',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Connect with Atlas to explore the power of Atlas Search.",
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/atlas-search/best-practices/',
    primaryActionButtonLink: 'https://www.mongodb.com/cloud/atlas/lp/search-1',
    primaryActionButtonLabel: 'Try Atlas Search',
  },
  {
    id: 'lookup-in-stage',
    title: '$lookup usage',
    description:
      '$lookup operations can be resource-intensive because they perform operations on two collections instead of one. In certain situations, embedding documents or arrays can enhance read performance.',
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/schema-suggestions/reduce-lookup-operations/#std-label-anti-pattern-denormalization',
  },
  {
    id: 'query-executed-without-index',
    title: 'Query executed without index',
    description: (
      <>
        This query ran without an index. If you plan on using this query{' '}
        <strong>heavily</strong> in your application, you should create an index
        that covers this query.
      </>
    ),
    learnMoreLink:
      'https://www.mongodb.com/docs/v6.0/core/data-model-operations/#indexes',
    primaryActionButtonLabel: 'Create index',
    primaryActionButtonIcon: 'Plus',
  },
  {
    id: 'atlas-text-regex-usage-in-query',
    title: 'Alternate text search options available',
    description:
      "In many cases, Atlas Search is MongoDB's most efficient full text search option. Convert your query to $search for a wider range of functionality.",
    learnMoreLink: 'https://www.mongodb.com/cloud/atlas/lp/search-1',
    primaryActionButtonLabel: 'Create Search index',
  },
  {
    id: 'bloated-document',
    title: 'Possibly bloated document',
    description:
      'Large documents can slow down queries by decreasing the number of documents that can be stored in RAM. Consider breaking up your data into more collections with smaller documents, and using references to consolidate the data you need.',
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/schema-suggestions/reduce-document-size/',
  },
  {
    id: 'explain-plan-without-index',
    title: 'Query executed without index',
    description: (
      <>
        This query ran without an index. If you plan on using this query{' '}
        <strong>heavily</strong> in your application, you should create an index
        that covers this aggregation.
      </>
    ),
    learnMoreLink:
      'https://www.mongodb.com/docs/v6.0/core/data-model-operations/#indexes',
    primaryActionButtonLabel: 'Create index',
    primaryActionButtonIcon: 'Plus',
  },
  {
    id: 'too-many-indexes',
    title: 'High number of indexes on collection',
    description:
      'Consider reviewing your indexes to remove any that are unnecessary. Learn more about this anti-pattern',
    learnMoreLink:
      'https://www.mongodb.com/docs/manual/core/data-model-operations/#indexes',
  },
  {
    id: 'too-many-collections',
    title: 'Databases with too many collections',
    description:
      "An excessive number of collections and their associated indexes can drain resources and impact your database's performance. In general, try to limit your replica set to 10,000 collections.",
    learnMoreLink:
      'https://www.mongodb.com/docs/v6.0/core/data-model-operations/#large-number-of-collections',
  },
  {
    id: 'unbound-array',
    title: 'Large array detected',
    description:
      'As arrays get larger, queries and indexes on that array field become less efficient. Ensure your arrays are bounded to maintain optimal query performance.',
    learnMoreLink:
      'https://www.mongodb.com/docs/atlas/schema-suggestions/avoid-unbounded-arrays/',
  },
] as const;

export const PerformanceSignals = new Map(
  SIGNALS.map((signal) => {
    return [signal.id, signal];
  })
) as {
  get(
    key: typeof SIGNALS[number]['id']
  ): Pick<Signal, keyof typeof SIGNALS[number]>;
};
