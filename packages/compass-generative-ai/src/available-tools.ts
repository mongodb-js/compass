export const READ_ONLY_DATABASE_TOOLS = [
  {
    name: 'find',
    description:
      'Retrieves specific documents that match your search criteria.',
  },
  {
    name: 'aggregate',
    description:
      'Performs complex data processing, grouping, and calculations.',
  },
  {
    name: 'count',
    description:
      'Quickly returns the total number of documents matching a query.',
  },
  {
    name: 'list-databases',
    description: 'Displays all available databases in the connected cluster.',
  },
  {
    name: 'list-collections',
    description: 'Shows all collections within a specified database.',
  },
  {
    name: 'collection-schema',
    description: 'Describes the schema structure of a collection.',
  },
  {
    name: 'collection-indexes',
    description: 'Lists all indexes defined on a collection.',
  },
  {
    name: 'collection-storage-size',
    description: 'Returns the storage size information for a collection.',
  },
  {
    name: 'db-stats',
    description: 'Provides database statistics including size and usage.',
  },
  {
    name: 'explain',
    description: 'Provides execution statistics and query plan information.',
  },
  {
    name: 'export',
    description: 'Exports query or aggregation results in EJSON format.',
  },
  {
    name: 'mongodb-logs',
    description: 'Returns the most recent logged mongod events.',
  },
];

export const AVAILABLE_TOOLS = [
  ...READ_ONLY_DATABASE_TOOLS,
  {
    name: 'get-current-query',
    description: 'Get the current query from the querybar.',
  },
  {
    name: 'get-current-pipeline',
    description: 'Get the current pipeline from the aggregation builder.',
  },
];
