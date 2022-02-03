import type { Item } from '../src/stores/aggregations-queries-items';
export const queries: Item[] = [
  {
    id: '1234',
    name: 'spaces in berlin',
    database: 'airbnb',
    collection: 'listings',
    lastModified: 11,
    type: 'query',
    query: {
      _id: '1234',
      _name: 'spaces in berlin',
      _ns: 'airbnb.listings',
      _dateSaved: 123456,
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
    type: 'query',
    query: {
      _id: '1234',
      _name: 'best spaces in berlin',
      _ns: 'airbnb.listings',
      _dateSaved: 123456,
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
    type: 'query',
    query: {
      _id: '1234',
      _name: 'best hosts in berlin',
      _ns: 'airbnb.hosts',
      _dateSaved: 123456,
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

export const aggregations = [
  {
    id: '61b753fdce2a0a1d7a32ae1d',
    name: 'Demo',
    database: 'airbnb',
    collection: 'listings',
    type: 'aggregation',
    lastModified: 21,
    aggregation: {
      namespace: 'airbnb.listings',
      env: 'on-prem',
      isTimeSeries: false,
      isReadonly: false,
      sourceName: null,
      pipeline: [
        {
          stageOperator: '$match',
          stage: '{\n  "reviews_per_month": 3\n}',
        },
        {
          stageOperator: '$limit',
          stage: '3',
        },
        {
          stageOperator: '$project',
          stage: '{\n  "_id": 0,\n  "name": 1,\n  "host_location": 1\n}',
        },
      ],
      name: 'Demo',
      id: '61b753fdce2a0a1d7a32ae1d',
      comments: true,
      sample: true,
      autoPreview: true,
      collation: null,
      collationString: '',
    },
  },
] as Item[];