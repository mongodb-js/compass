import { expect } from 'chai';
import type { Item } from '../stores/aggregations-queries-items';
import { useGridFilters, useFilteredItems } from './use-grid-filters';

const items: Item[] = [
  {
    id: '1234',
    name: 'spaces in berlin',
    database: 'airbnb',
    collection: 'listings',
    lastModified: 123456,
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
    lastModified: 123456,
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
    lastModified: 123456,
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
  {
    id: '61b753fdce2a0a1d7a32ae1d',
    name: 'Demo',
    database: 'airbnb',
    collection: 'listings',
    type: 'aggregation',
    lastModified: 5,
    aggregation: {
      namespace: 'airbnb.listings',
      env: 'on-prem',
      isTimeSeries: false,
      isReadonly: false,
      sourceName: null,
      pipeline: [
        {
          id: '61b8a4a2ffab3b5b30862d8b',
          stageOperator: '$match',
          stage: '{\n  "reviews_per_month": 3\n}',
          isValid: true,
          isEnabled: true,
          isExpanded: true,
          isLoading: false,
          isComplete: false,
          previewDocuments: [],
          syntaxError: null,
          error: null,
          projections: [],
        },
        {
          id: '61b8a4a2ffab3b5b30862d8c',
          stageOperator: '$limit',
          stage: '3',
          isValid: true,
          isEnabled: true,
          isExpanded: true,
          isLoading: false,
          isComplete: true,
          previewDocuments: [],
          syntaxError: null,
          error: null,
          projections: [],
          fromStageOperators: false,
          executor: {
            $limit: 3,
          },
          isMissingAtlasOnlyStageSupport: false,
        },
        {
          id: '61b8a4a2ffab3b5b30862d8d',
          stageOperator: '$project',
          stage: '{\n  "_id": 0,\n  "name": 1,\n  "host_location": 1\n}',
          isValid: true,
          isEnabled: true,
          isExpanded: true,
          isLoading: false,
          isComplete: true,
          previewDocuments: [],
          syntaxError: null,
          error: null,
          projections: [
            {
              name: 'name',
              value: 'name',
              score: 1,
              meta: '1',
              version: '0.0.0',
              index: 2,
            },
            {
              name: 'host_location',
              value: 'host_location',
              score: 1,
              meta: '1',
              version: '0.0.0',
              index: 2,
            },
          ],
          isMissingAtlasOnlyStageSupport: false,
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
];

describe('use-grid-filters', function () {
  describe('useGridFilters', function () {
    it('should render search input');
    it('should render database and collection selects');
    it('should render sort options');
  });

  describe('useFilteredItems', function () {
    it('it should not filter items when no filter is used', function () {
      expect(useFilteredItems(items, {}, ''), '').to.have.lengthOf(
        items.length
      );
    });

    it('should filter items by conditions', function () {
      expect(
        useFilteredItems(items, { database: 'airbnb' }, ''),
        'it should filter items by database'
      ).to.have.lengthOf(items.filter((x) => x.database === 'airbnb').length);

      expect(
        useFilteredItems(items, { collection: 'hosts' }, ''),
        'it should filter items by collection'
      ).to.have.lengthOf(items.filter((x) => x.collection === 'hosts').length);

      expect(
        useFilteredItems(
          items,
          { database: 'airbnb', collection: 'listings' },
          ''
        ),
        'it should filter items by database and collection'
      ).to.have.lengthOf(
        items.filter(
          (x) => x.database === 'airbnb' && x.collection === 'listings'
        ).length
      );
    });

    it('should filter items by search text', function () {
      expect(
        useFilteredItems(items, {}, 'airbnb'),
        'it should filter items by search text - database name'
      ).to.have.lengthOf(4);

      expect(
        useFilteredItems(items, {}, 'listings'),
        'it should filter items by search text - collection name'
      ).to.have.lengthOf(3);

      expect(
        useFilteredItems(items, {}, 'host_location'),
        'it should filter items by search text - filter key'
      ).to.have.lengthOf(4);

      expect(
        useFilteredItems(items, {}, 'reviews'),
        'it should filter items by search text - sort key (reviews)'
      ).to.have.lengthOf(3);

      expect(
        useFilteredItems(items, {}, 'beds'),
        'it should filter items by search text - sort & project key (beds)'
      ).to.have.lengthOf(2);
    });

    it('should filter items by conditions and search text');
  });
});
