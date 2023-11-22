export const DATE = new Date('01/01/2020');

export const queries = [
  {
    id: '1234',
    name: 'spaces in berlin',
    database: 'airbnb',
    collection: 'listings',
    lastModified: 11,
    type: 'query' as const,
    query: {
      _id: '1234',
      _name: 'spaces in berlin',
      _ns: 'airbnb.listings',
      _dateSaved: DATE,
      _dateModified: DATE,
      _lastExecuted: DATE,
      filter: {
        host_location: RegExp('berlin'),
      },
      project: {
        id: 1,
        name: 1,
        beds: 1,
      },
      sort: {
        beds: -1,
      },
      skip: 2,
      limit: 4,
      collation: {
        locale: 'simple',
      },
    },
  },
  {
    id: '5678',
    name: 'best spaces in berlin',
    database: 'airbnb',
    collection: 'listings',
    lastModified: 12,
    type: 'query' as const,
    query: {
      _id: '5678',
      _name: 'best spaces in berlin',
      _ns: 'airbnb.listings',
      _dateSaved: DATE,
      _dateModified: DATE,
      _lastExecuted: DATE,
      filter: {
        host_location: RegExp('berlin'),
      },
      project: {
        id: 1,
        name: 1,
        beds: 1,
      },
      sort: {
        reviews: -1,
        num_of_host_spaces: 1,
      },
      skip: 0,
      limit: 10,
      collation: {
        locale: 'simple',
      },
    },
  },
  {
    id: '9012',
    name: 'best hosts in berlin',
    database: 'airbnb',
    collection: 'hosts',
    lastModified: 13,
    type: 'query' as const,
    query: {
      _id: '9012',
      _name: 'best hosts in berlin',
      _ns: 'airbnb.hosts',
      _dateSaved: DATE,
      _dateModified: DATE,
      _lastExecuted: DATE,
      filter: {
        host_location: RegExp('berlin'),
      },
      project: {
        id: 1,
        name: 1,
      },
      sort: {
        reviews: -1,
      },
      skip: 0,
      limit: 10,
      collation: {
        locale: 'simple',
      },
    },
  },
];

export const pipelines = [
  {
    id: '61b753fdce2a0a1d7a32ae1d',
    name: 'Demo',
    database: 'airbnb',
    collection: 'listings',
    type: 'aggregation' as const,
    lastModified: 21,
    aggregation: {
      namespace: 'airbnb.listings',
      pipelineText: `[{$match: {\n  "reviews_per_month": 3\n}}, {$limit: /**\n * Provide the number of documents to limit.\n */\n10}, {$project: {\n  "_id": 0,\n  "name": 1,\n  "host_location": 1\n}}]`,
      name: 'Demo',
      id: '61b753fdce2a0a1d7a32ae1d',
      comments: true,
      autoPreview: true,
      collationString: '',
    },
  },
];
