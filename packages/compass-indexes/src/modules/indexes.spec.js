/* eslint-disable no-use-before-define */
import { expect } from 'chai';
import sinon from 'sinon';

import reducer, {
  loadIndexesFromDb,
  loadIndexes,
  sortIndexes,
  LOAD_INDEXES,
  SORT_INDEXES,
  ASC,
  DESC,
  DEFAULT,
  USAGE,
} from './indexes';

import { HANDLE_ERROR } from './error';

describe('indexes module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is LOAD_INDEXES', function () {
        it('returns the default sorted', function () {
          expect(reducer(undefined, loadIndexes(defaultSort))).to.deep.equal(
            defaultSort
          );
        });
      });

      context('when the action is SORT_INDEXES', function () {
        context('when the column is Usage', function () {
          context('when sorting asc', function () {
            it('returns the sorted indexes list', function () {
              expect(
                reducer(undefined, sortIndexes(defaultSort, USAGE, ASC))
              ).to.deep.equal(usageSort);
            });
          });

          context('when sorting desc', function () {
            it('returns the sorted indexes list', function () {
              expect(
                reducer(undefined, sortIndexes(defaultSort, USAGE, DESC))
              ).to.deep.equal(usageSortDesc);
            });
          });
        });

        context('when the column is Name and Definition', function () {
          context('when sorting asc', function () {
            it('returns the sorted indexes list', function () {
              expect(
                reducer(undefined, sortIndexes(usageSort, DEFAULT, ASC))
              ).to.deep.equal(defaultSort);
            });
          });

          context('when sorting desc', function () {
            it('returns the sorted indexes list', function () {
              expect(
                reducer(undefined, sortIndexes(usageSort, DEFAULT, DESC))
              ).to.deep.equal(defaultSortDesc);
            });
          });
        });
      });

      context('when an action is not provided', function () {
        it('returns the default state', function () {
          expect(reducer(undefined, {})).to.deep.equal([]);
        });
      });
    });
  });

  describe('#loadIndexes', function () {
    it('returns the action', function () {
      expect(loadIndexes([])).to.deep.equal({
        type: LOAD_INDEXES,
        indexes: [],
      });
    });
  });

  describe('#sortIndexes', function () {
    it('returns the action', function () {
      expect(sortIndexes([], 'Database Name', DESC)).to.deep.equal({
        type: SORT_INDEXES,
        indexes: [],
        column: 'Database Name',
        order: DESC,
      });
    });
  });
  describe('#loadIndexesFromDb', function () {
    let actionSpy;
    let emitSpy;
    beforeEach(function () {
      actionSpy = sinon.spy();
      emitSpy = sinon.spy();
    });
    afterEach(function () {
      actionSpy = null;
      emitSpy = null;
    });
    it('returns loadIndexes action with empty list for readonly', function () {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          expect(res).to.deep.equal({ type: LOAD_INDEXES, indexes: [] });
          actionSpy();
        }
      };
      const state = () => ({
        appRegistry: {
          emit: emitSpy,
        },
        isReadonly: true,
        namespace: 'citibike.trips',
      });
      loadIndexesFromDb()(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });

    it('returns loadIndexes action with error for error state', function () {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          if (res.type === LOAD_INDEXES) {
            expect(res).to.deep.equal({ type: LOAD_INDEXES, indexes: [] });
            actionSpy();
          } else if (res.type === HANDLE_ERROR) {
            expect(res).to.deep.equal({
              type: HANDLE_ERROR,
              error: 'error message!',
            });
            actionSpy();
          } else {
            expect(true, 'unknown action called').to.be.false();
          }
        }
      };
      const state = () => ({
        appRegistry: {
          emit: emitSpy,
        },
        isReadonly: false,
        dataService: {
          indexes: (ns, opts, cb) => {
            cb({ message: 'error message!' });
          },
          isConnected: () => true,
        },
        namespace: 'citibike.trips',
      });
      loadIndexesFromDb()(dispatch, state);
      expect(actionSpy.calledTwice).to.equal(true);
    });

    it('returns loadIndexes action with sorted and modelled indexes', function () {
      const dispatch = (res) => {
        if (typeof res !== 'function') {
          expect(Object.keys(res)).to.deep.equal(['type', 'indexes']);
          expect(res.type).to.equal(LOAD_INDEXES);
          expect(JSON.stringify(res.indexes, null, '\n')).to.equal(
            JSON.stringify(defaultSort, null, '\n')
          );
          actionSpy();
        }
      };
      const state = () => ({
        appRegistry: {
          emit: emitSpy,
        },
        isReadonly: false,
        dataService: {
          indexes: (ns, opts, cb) => {
            cb(null, fromDB);
          },
          isConnected: () => true,
        },
        sortColumn: DEFAULT,
        sortOrder: ASC,
        namespace: 'citibike.trips',
      });
      loadIndexesFromDb()(dispatch, state);
      expect(actionSpy.calledOnce).to.equal(true);
    });
  });
});

const fromDB = [
  {
    name: '_id_',
    v: 2,
    key: { _id: 1 },
    usageHost: 'computername.local:27017',
    usageCount: 6,
    usageSince: '2019-02-08T10:21:49.176Z',
    size: 135168,
  },
  {
    name: 'CCCC',
    v: 2,
    key: { cccc0: -1, cccc1: '2dsphere', cccc2: 1 },
    '2dsphereIndexVersion': 3,
    usageHost: 'computername.local:27017',
    usageCount: 5,
    usageSince: '2019-02-08T14:38:56.147Z',
    size: 4096,
  },
  {
    name: 'AAAA',
    v: 2,
    key: { aaaa: -1 },
    expireAfterSeconds: 300,
    partialFilterExpression: { y: 1 },
    usageHost: 'computername.local:27017',
    usageCount: 4,
    usageSince: '2019-02-08T14:39:56.285Z',
    size: 4096,
  },
  {
    name: 'BBBB',
    v: 2,
    key: { 'bbbb.abcd': 1 },
    collation: {
      locale: 'ar',
      caseLevel: true,
      caseFirst: 'lower',
      strength: 3,
      numericOrdering: false,
      alternate: 'non-ignorable',
      maxVariable: 'space',
      normalization: true,
      backwards: true,
      version: '57.1',
    },
    usageHost: 'computername.local:27017',
    usageCount: 10,
    usageSince: '2019-02-08T14:40:13.609Z',
    size: 94208,
  },
];

const defaultSort = [
  {
    ns: 'citibike.trips',
    key: { aaaa: -1 },
    name: 'AAAA',
    size: 4096,
    usageCount: 4,
    usageSince: '2019-02-08T14:39:56.285Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      expireAfterSeconds: 300,
      partialFilterExpression: { y: 1 },
    },
    id: 'citibike.trips.AAAA',
    unique: false,
    sparse: false,
    ttl: true,
    hashed: false,
    geo: false,
    compound: false,
    single: true,
    partial: true,
    text: false,
    wildcard: false,
    collation: false,
    clustered: false,
    columnstore: false,
    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],
  },
  {
    ns: 'citibike.trips',
    key: { 'bbbb.abcd': 1 },
    name: 'BBBB',
    size: 94208,
    usageCount: 10,
    usageSince: '2019-02-08T14:40:13.609Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      collation: {
        locale: 'ar',
        caseLevel: true,
        caseFirst: 'lower',
        strength: 3,
        numericOrdering: false,
        alternate: 'non-ignorable',
        maxVariable: 'space',
        normalization: true,
        backwards: true,
        version: '57.1',
      },
    },
    id: 'citibike.trips.BBBB',
    unique: false,
    sparse: false,
    ttl: false,
    hashed: false,
    geo: false,
    compound: false,
    single: true,
    partial: false,
    text: false,
    wildcard: false,
    collation: true,
    clustered: false,
    columnstore: false,
    type: 'regular',
    cardinality: 'single',
    properties: ['collation'],
  },
  {
    ns: 'citibike.trips',
    key: { cccc0: -1, cccc1: '2dsphere', cccc2: 1 },
    name: 'CCCC',
    size: 4096,
    usageCount: 5,
    usageSince: '2019-02-08T14:38:56.147Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: { '2dsphereIndexVersion': 3 },
    id: 'citibike.trips.CCCC',
    unique: false,
    sparse: false,
    ttl: false,
    hashed: false,
    geo: true,
    compound: true,
    single: false,
    partial: false,
    text: false,
    wildcard: false,
    collation: false,
    clustered: false,
    columnstore: false,
    type: 'geospatial',
    cardinality: 'compound',
    properties: [],
  },
  {
    ns: 'citibike.trips',
    key: { _id: 1 },
    name: '_id_',
    size: 135168,
    usageCount: 6,
    usageSince: '2019-02-08T10:21:49.176Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {},
    id: 'citibike.trips._id_',
    unique: true,
    sparse: false,
    ttl: false,
    hashed: false,
    geo: false,
    compound: false,
    single: true,
    partial: false,
    text: false,
    wildcard: false,
    collation: false,
    clustered: false,
    columnstore: false,
    type: 'regular',
    cardinality: 'single',
    properties: ['unique'],
  },
];
const defaultSortDesc = [...defaultSort].reverse();

const usageSort = [
  {
    name: 'AAAA',
    usageCount: 4,
    ns: 'citibike.trips',
    key: { aaaa: -1 },
    size: 4096,
    usageSince: '2019-02-08T14:39:56.285Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      expireAfterSeconds: 300,
      partialFilterExpression: { y: 1 },
    },
    id: 'citibike.trips.AAAA',
    unique: false,
    sparse: false,
    ttl: true,
    hashed: false,
    geo: false,
    compound: false,
    single: true,
    partial: true,
    text: false,
    wildcard: false,
    collation: false,
    clustered: false,
    columnstore: false,
    type: 'regular',
    cardinality: 'single',
    properties: ['partial', 'ttl'],
  },
  {
    name: 'CCCC',
    usageCount: 5,
    ns: 'citibike.trips',
    key: { cccc0: -1, cccc1: '2dsphere', cccc2: 1 },
    size: 4096,
    usageSince: '2019-02-08T14:38:56.147Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: { '2dsphereIndexVersion': 3 },
    id: 'citibike.trips.CCCC',
    unique: false,
    sparse: false,
    ttl: false,
    hashed: false,
    geo: true,
    compound: true,
    single: false,
    partial: false,
    text: false,
    wildcard: false,
    collation: false,
    clustered: false,
    columnstore: false,
    type: 'geospatial',
    cardinality: 'compound',
    properties: [],
  },
  {
    name: '_id_',
    usageCount: 6,
    ns: 'citibike.trips',
    key: { _id: 1 },
    size: 135168,
    usageSince: '2019-02-08T10:21:49.176Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {},
    id: 'citibike.trips._id_',
    unique: true,
    sparse: false,
    ttl: false,
    hashed: false,
    geo: false,
    compound: false,
    single: true,
    partial: false,
    text: false,
    wildcard: false,
    collation: false,
    clustered: false,
    columnstore: false,
    type: 'regular',
    cardinality: 'single',
    properties: ['unique'],
  },
  {
    name: 'BBBB',
    usageCount: 10,
    ns: 'citibike.trips',
    key: { 'bbbb.abcd': 1 },
    size: 94208,
    usageSince: '2019-02-08T14:40:13.609Z',
    usageHost: 'computername.local:27017',
    version: 2,
    extra: {
      collation: {
        locale: 'ar',
        caseLevel: true,
        caseFirst: 'lower',
        strength: 3,
        numericOrdering: false,
        alternate: 'non-ignorable',
        maxVariable: 'space',
        normalization: true,
        backwards: true,
        version: '57.1',
      },
    },
    id: 'citibike.trips.BBBB',
    unique: false,
    sparse: false,
    ttl: false,
    hashed: false,
    geo: false,
    compound: false,
    single: true,
    partial: false,
    text: false,
    wildcard: false,
    collation: true,
    clustered: false,
    columnstore: false,
    type: 'regular',
    cardinality: 'single',
    properties: ['collation'],
  },
];
const usageSortDesc = [...usageSort].reverse();
