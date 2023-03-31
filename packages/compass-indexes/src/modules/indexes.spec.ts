import { expect } from 'chai';
import type { DataService } from 'mongodb-data-service';
import { spy } from 'sinon';

import type { IndexDefinition } from './indexes';
import reducer, {
  ActionTypes as IndexesActionTypes,
  fetchIndexes,
  loadIndexes,
  sortIndexes,
} from './indexes';
import { ActionTypes as IsRefreshingActionTypes } from './is-refreshing';
import { dataServiceConnected } from './data-service';
import type { RootState } from '.';
import configureStore from '../stores/store';
import { inProgressIndexAdded } from './in-progress-indexes';
import type { Document } from 'bson';

// the conversion from the ampersand index model keeps around some
// of the original "underived" properties that are not used and not part of
// IndexDefinition
type RawIndexDefinition = Partial<IndexDefinition> & {
  id: string;
  key: Record<string, string | number>;
  version?: number;
  clustered?: boolean;
  collation?: boolean;
  columnstore?: boolean;
  compound?: boolean;
  geo?: boolean;
  hashed?: boolean;
  partial?: boolean;
  single?: boolean;
  sparse?: boolean;
  text?: boolean;
  ttl?: boolean;
  unique?: boolean;
  wildcard?: boolean;
};

describe('indexes module', function () {
  let fromDB: Document[];
  let defaultSort: RawIndexDefinition[];
  let defaultSortDesc: RawIndexDefinition[];
  let usageSort: RawIndexDefinition[];
  let usageSortDesc: RawIndexDefinition[];
  let expectedInprogressIndexes: RawIndexDefinition[];
  let store: ReturnType<typeof configureStore>;
  beforeEach(function () {
    store = configureStore({ namespace: 'citibike.trips' });
    fromDB = [
      {
        name: '_id_',
        version: 2,
        extra: {},
        key: { _id: 1 },
        usageHost: 'computername.local:27017',
        usageCount: 6,
        usageSince: new Date('2019-02-08T10:21:49.176Z'),
        size: 135168,
      },
      {
        name: 'CCCC',
        version: 2,
        extra: {},
        key: { cccc0: -1, cccc1: '2dsphere', cccc2: 1 },
        '2dsphereIndexVersion': 3,
        usageHost: 'computername.local:27017',
        usageCount: 5,
        usageSince: new Date('2019-02-08T14:38:56.147Z'),
        size: 4096,
      },
      {
        name: 'AAAA',
        version: 2,
        extra: {},
        key: { aaaa: -1 },
        expireAfterSeconds: 300,
        partialFilterExpression: { y: 1 },
        usageHost: 'computername.local:27017',
        usageCount: 4,
        usageSince: new Date('2019-02-08T14:39:56.285Z'),
        size: 4096,
      },
      {
        name: 'BBBB',
        version: 2,
        extra: {},
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
        usageSince: new Date('2019-02-08T14:40:13.609Z'),
        size: 94208,
      },
    ];

    defaultSort = [
      {
        ns: 'citibike.trips',
        key: { aaaa: -1 },
        name: 'AAAA',
        size: 4096,
        usageCount: 4,
        usageSince: new Date('2019-02-08T14:39:56.285Z'),
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
        usageSince: new Date('2019-02-08T14:40:13.609Z'),
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
        usageSince: new Date('2019-02-08T14:38:56.147Z'),
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
        usageSince: new Date('2019-02-08T10:21:49.176Z'),
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
    defaultSortDesc = [...defaultSort].reverse();

    usageSort = [
      {
        name: 'AAAA',
        usageCount: 4,

        ns: 'citibike.trips',
        key: { aaaa: -1 },
        size: 4096,
        usageSince: new Date('2019-02-08T14:39:56.285Z'),
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
        usageSince: new Date('2019-02-08T14:38:56.147Z'),
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
        usageSince: new Date('2019-02-08T10:21:49.176Z'),
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
        usageSince: new Date('2019-02-08T14:40:13.609Z'),
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
    usageSortDesc = [...usageSort].reverse();

    expectedInprogressIndexes = [
      {
        name: 'AAAA',
        version: 2,
        extra: {
          status: 'inprogress',
        },
        key: {
          aaaa: -1,
        },
        expireAfterSeconds: 300,
        partialFilterExpression: {
          y: 1,
        },
        usageHost: 'computername.local:27017',
        usageCount: 4,
        usageSince: new Date('2019-02-08T14:39:56.285Z'),
        size: 4096,
      },
      {
        id: 'citibike.trips.z',
        extra: {
          status: 'inprogress',
        },
        key: {
          z: 1,
        },
        fields: [
          {
            field: 'z',
            value: 1,
          },
        ],
        name: 'z',
        ns: 'citibike.trips',
        size: 0,
        relativeSize: 0,
        usageCount: 0,
      },
    ] as any;
  });

  describe('#reducer', function () {
    describe('when loading indexes', function () {
      it('uses default sort order and column when user has not selected any', function () {
        expect(
          reducer(undefined, loadIndexes(defaultSort as any))
        ).to.deep.equal(defaultSort);
      });
    });

    describe('sorting indexes', function () {
      describe('Usage column', function () {
        it('asc sort', function () {
          store.dispatch(loadIndexes(defaultSort as any));
          store.dispatch(sortIndexes('Usage', 'asc'));
          const state = store.getState();
          expect(state.indexes).to.deep.equal(usageSort);
        });
        it('desc sort', function () {
          store.dispatch(loadIndexes(defaultSort as any));
          store.dispatch(sortIndexes('Usage', 'desc'));
          const state = store.getState();
          expect(state.indexes).to.deep.equal(usageSortDesc);
        });
      });

      describe('Name and Definition column', function () {
        it('asc sort', function () {
          store.dispatch(loadIndexes(usageSort as any));
          store.dispatch(sortIndexes('Name and Definition', 'asc'));
          const state = store.getState();
          expect(state.indexes).to.deep.equal(defaultSort);
        });
        it('desc sort', function () {
          store.dispatch(loadIndexes(usageSort as any));
          store.dispatch(sortIndexes('Name and Definition', 'desc'));
          const state = store.getState();
          expect(state.indexes).to.deep.equal(defaultSortDesc);
        });
      });
    });

    context('when no action is provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {} as any)).to.deep.equal([]);
      });
    });
  });

  it('#loadIndexes action', function () {
    store.dispatch(loadIndexes([]));
    expect(store.getState().indexes).to.deep.equal([]);

    store.dispatch(loadIndexes(usageSort as any));
    expect(JSON.stringify(store.getState().indexes)).to.equal(
      JSON.stringify(usageSort)
    );
  });

  it('#sortIndexes action', function () {
    store.dispatch(loadIndexes(defaultSort as any));
    store.dispatch(sortIndexes('Name and Definition', 'desc'));
    const state = store.getState();
    expect(state.sortColumn).to.equal('Name and Definition');
    expect(state.sortOrder).to.equal('desc');
    expect(JSON.stringify(state.indexes)).to.equal(
      JSON.stringify(defaultSortDesc)
    );
  });

  describe('#fetchIndexes', function () {
    it('sets indexes to empty array for readonly', function () {
      const dispatchSpy = spy();
      const dispatch = (x: any) => {
        dispatchSpy(x);
        return x;
      };
      const getState = () => ({ isReadonly: true } as any as RootState);

      void fetchIndexes()(dispatch, getState);

      expect(dispatchSpy.callCount).to.equal(3);

      expect(dispatchSpy.getCall(0).args[0]).to.deep.equal({
        type: IndexesActionTypes.LoadIndexes,
        indexes: [],
      });
      expect(dispatchSpy.getCall(1).args[0]).to.deep.equal({
        type: IsRefreshingActionTypes.RefreshFinished,
      });
      expect(typeof dispatchSpy.getCall(2).args[0] === 'function').to.true;
    });

    it('when dataService is not connected, sets refreshing to false', async function () {
      store.dispatch({
        type: IndexesActionTypes.LoadIndexes,
        indexes: defaultSort,
      });
      // Mock dataService.indexes
      store.dispatch(
        dataServiceConnected(
          new (class {
            isConnected() {
              return false;
            }
          })() as DataService
        )
      );

      await store.dispatch(fetchIndexes());

      const state = store.getState();
      expect(state.indexes).to.deep.equal(defaultSort);
      expect(state.isRefreshing).to.equal(false);
    });

    it('sets indexes to empty array when there is an error', async function () {
      const error = new Error('failed to connect to server');
      // Set some data to validate the empty array condition
      store.dispatch({
        type: IndexesActionTypes.LoadIndexes,
        indexes: defaultSort,
      });
      // Mock dataService.indexes
      store.dispatch(
        dataServiceConnected({
          isConnected() {
            return true;
          },
          indexes: () => Promise.reject(error),
        } as any)
      );

      await store.dispatch(fetchIndexes());

      const state = store.getState();
      expect(state.indexes).to.deep.equal([]);
      expect(state.error).to.equal(error.message);
      expect(state.isRefreshing).to.equal(false);
    });

    it('sets indexes when fetched successfully', async function () {
      // Set indexes to empty
      store.dispatch(loadIndexes([]));
      store.dispatch(sortIndexes('Name and Definition', 'asc'));
      store.dispatch(
        dataServiceConnected({
          isConnected() {
            return true;
          },
          indexes: () => Promise.resolve([fromDB[0]]),
        } as any)
      );

      await store.dispatch(fetchIndexes());

      const state = store.getState();
      expect(state.indexes[0]).to.deep.eq(fromDB[0]);
      expect(state.error).to.be.null;
      expect(state.isRefreshing).to.equal(false);
    });

    it('merges with in progress indexes', async function () {
      // Set indexes to empty
      store.dispatch(loadIndexes([]));
      store.dispatch(
        inProgressIndexAdded({
          id: 'citibike.trips.z',
          extra: { status: 'inprogress' },
          key: { z: 1 },
          fields: [{ field: 'z', value: 1 }],
          name: 'AAAA',
          ns: 'citibike.trips',
          size: 0,
          relativeSize: 0,
          usageCount: 0,
        })
      );
      store.dispatch(
        inProgressIndexAdded({
          id: 'citibike.trips.z',
          extra: { status: 'inprogress' },
          key: { z: 1 },
          fields: [{ field: 'z', value: 1 }],
          name: 'z',
          ns: 'citibike.trips',
          size: 0,
          relativeSize: 0,
          usageCount: 0,
        })
      );
      // store.dispatch(sortIndexes('Name and Definition', 'asc'));
      store.dispatch(
        dataServiceConnected({
          isConnected() {
            return true;
          },
          indexes: () => Promise.resolve(fromDB),
        } as any)
      );

      await store.dispatch(fetchIndexes());

      const state = store.getState();

      expect(state.indexes.length).to.equal(defaultSort.length + 1);

      const indexes = state.indexes.filter(
        (index: any) => index.extra.status === 'inprogress'
      );

      expect(indexes).to.deep.equal(expectedInprogressIndexes);

      expect(state.error).to.be.null;
      expect(state.isRefreshing).to.equal(false);
    });
  });
});
