import { expect } from 'chai';
import { setTimeout as wait } from 'timers/promises';
import sinon from 'sinon';
import {
  fetchIndexes,
  refreshRegularIndexes,
  dropIndex,
  hideIndex,
  unhideIndex,
} from './regular-indexes';
import {
  indexesList,
  defaultSortedIndexes,
  //usageSortedIndexes,
  inProgressIndexes,
} from '../../test/fixtures/regular-indexes';
import { readonlyViewChanged } from './is-readonly-view';
import { setupStore } from '../../test/setup-store';

// Importing this to stub showConfirmation
import * as regularIndexesSlice from './regular-indexes';

describe('regular-indexes module', function () {
  before(() => {
    sinon.stub(regularIndexesSlice, 'showConfirmation').resolves(true);
  });

  after(() => {
    sinon.restore();
  });

  describe('#fetchIndexes action', function () {
    it('sets indexes to empty array for views', async function () {
      const indexesSpy = sinon.spy();
      const store = setupStore(
        {},
        {
          indexes: indexesSpy,
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          indexes: defaultSortedIndexes.map((index) => ({ ...index })),
        },
      });

      store.dispatch(readonlyViewChanged(true));

      await store.dispatch(fetchIndexes());

      expect(store.getState().regularIndexes.indexes).to.have.lengthOf(0);
      expect(indexesSpy.callCount).to.equal(0);
    });

    it('sets indexes to empty array when there is an error', async function () {
      const error = new Error('failed to connect to server');
      const store = setupStore(
        {},
        {
          indexes: () => Promise.reject(error),
        }
      );

      // Set some data to validate the empty array condition
      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          indexes: defaultSortedIndexes.slice(),
        },
      });

      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;
      expect(state.indexes).to.deep.equal([]);
      expect(state.error).to.equal(error.message);
      expect(state.isRefreshing).to.equal(false);
    });

    it('sets indexes when fetched successfully', async function () {
      const store = setupStore(
        {},
        {
          indexes: () => Promise.resolve(defaultSortedIndexes),
        }
      );
      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;
      expect(state.indexes).to.deep.eq(defaultSortedIndexes);
      expect(state.error).to.be.null;
      expect(state.isRefreshing).to.equal(false);
    });

    it('merges with in progress indexes', async function () {
      const store = setupStore(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          inProgressIndexes: inProgressIndexes.slice(),
        },
      });

      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;

      expect(state.indexes.length).to.equal(
        defaultSortedIndexes.length + inProgressIndexes.length
      );

      const indexes = state.indexes.filter(
        (index: any) => index.extra.status === 'inprogress'
      );

      expect(indexes).to.deep.equal([
        // NOTE: this one is a real index and an in-progress one
        {
          cardinality: 'single',
          extra: {
            status: 'inprogress',
          },
          fields: [],
          key: {
            aaaa: -1,
          },
          name: 'AAAA',
          ns: 'foo',
          properties: ['partial', 'ttl'],
          relativeSize: 1,
          size: 4096,
          type: 'regular',
          usageCount: 4,
          usageHost: 'computername.local:27017',
          usageSince: new Date('2019-02-08T14:39:56.285Z'),
          version: 2,
        },
        // NOTE: this one is only in progress, not also a real index
        {
          extra: {
            status: 'inprogress',
          },
          fields: [
            {
              field: 'z',
              value: 1,
            },
          ],
          key: {
            z: 1,
          },
          name: 'z',
          ns: 'citibike.trips',
          relativeSize: 0,
          size: 0,
          usageCount: 0,
        },
      ]);

      expect(state.error).to.be.null;
      expect(state.isRefreshing).to.equal(false);
    });
  });

  describe('#refreshRegularIndexes action', function () {
    it('sets isRefreshing when indexes are refreshed', async function () {
      const store = setupStore(
        {},
        {
          indexes: async () => {
            await wait(100);
            return defaultSortedIndexes;
          },
        }
      );

      // don't await so we can check the intermediate result
      void store.dispatch(refreshRegularIndexes());
      expect(store.getState().regularIndexes.isRefreshing).to.be.true;

      await wait(100);
      expect(store.getState().regularIndexes.isRefreshing).to.be.false;
      expect(store.getState().regularIndexes.indexes).to.deep.equal(
        defaultSortedIndexes
      );
    });
  });

  describe('#failedIndexRemoved', function () {
    it('removes an in-progress index with the specified id', async function () {});
  });

  describe('#dropIndex (thunk)', function () {
    it('removes a failed in-progress index', async function () {
      const store = setupStore(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          inProgressIndexes: inProgressIndexes.map((_index) => {
            const index = {
              ..._index,
            };
            if (index.name === 'AAAA') {
              index.extra.status = 'failed';
            }
            return index;
          }),
        },
      });

      // fetch first so it merges the in-progress ones
      await store.dispatch(fetchIndexes());

      // one of the real indexes is also in progress, so gets merged together
      const numOverlapping = 1;

      // sanity check
      let state = store.getState().regularIndexes;
      expect(state.indexes.length).to.equal(
        indexesList.length + inProgressIndexes.length - numOverlapping
      );
      expect(state.inProgressIndexes.length).to.equal(inProgressIndexes.length);

      await store.dispatch(dropIndex('AAAA'));

      state = store.getState().regularIndexes;

      expect(state.indexes.length).to.equal(
        indexesList.length + inProgressIndexes.length - 1
      );
      expect(state.inProgressIndexes.length).to.equal(
        inProgressIndexes.length - 1
      );

      expect(state.inProgressIndexes[0].name).to.equal('z');
    });

    it('removes a real index', async function () {
      const store = setupStore(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
        }
      );

      Object.assign(store.getState(), {
        regularIndexes: {
          ...store.getState().regularIndexes,
          inProgressIndexes: inProgressIndexes.map((_index) => {
            const index = {
              ..._index,
            };
            return index;
          }),
        },
      });

      // fetch first so it merges the in-progress ones
      await store.dispatch(fetchIndexes());

      // one of the real indexes is also in progress, so gets merged together
      const numOverlapping = 1;

      // sanity check
      let state = store.getState().regularIndexes;
      expect(state.indexes.length).to.equal(
        indexesList.length + inProgressIndexes.length - numOverlapping
      );
      expect(state.inProgressIndexes.length).to.equal(inProgressIndexes.length);

      await store.dispatch(dropIndex('BBBB')); // a real regular index. not in progress

      state = store.getState().regularIndexes;

      expect(state.indexes.length).to.equal(
        indexesList.length + inProgressIndexes.length - 1
      );
      expect(state.inProgressIndexes.length).to.equal(inProgressIndexes.length);
    });
  });

  describe('#hideIndex (thunk)', function () {
    it('hides an index', async function () {
      const updateCollection = sinon.stub().resolves({});
      const store = setupStore(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
          updateCollection,
        }
      );

      // fetch indexes so there's something to hide
      await store.dispatch(fetchIndexes());

      await store.dispatch(hideIndex('BBBB'));

      expect(updateCollection.args).to.deep.equal([
        ['citibike.trips', { index: { hidden: true, name: 'BBBB' } }],
      ]);
    });
  });

  describe('#unhideIndex (thunk)', function () {
    it('unhides an index', async function () {
      const updateCollection = sinon.stub().resolves({});
      const store = setupStore(
        {},
        {
          indexes: () => Promise.resolve(indexesList),
          updateCollection,
        }
      );

      // fetch indexes so there's something to hide
      await store.dispatch(fetchIndexes());

      await store.dispatch(unhideIndex('BBBB'));

      expect(updateCollection.args).to.deep.equal([
        ['citibike.trips', { index: { hidden: false, name: 'BBBB' } }],
      ]);
    });
  });
});
