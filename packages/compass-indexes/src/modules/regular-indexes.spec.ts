import { expect } from 'chai';
import { setTimeout as wait } from 'timers/promises';
import Sinon from 'sinon';
import {
  ActionTypes,
  fetchIndexes,
  setRegularIndexes,
  sortRegularIndexes,
  refreshRegularIndexes,
  inProgressIndexAdded,
  inProgressIndexRemoved,
  inProgressIndexFailed,
} from './regular-indexes';
import {
  indexesList,
  defaultSortedIndexes,
  usageSortedIndexes,
  inProgressIndexes,
} from '../../test/fixtures/regular-indexes';
import { readonlyViewChanged } from './is-readonly-view';
import { setupStore } from '../../test/setup-store';

const defaultSortedDesc = [...defaultSortedIndexes].reverse();
const usageSortedDesc = [...usageSortedIndexes].reverse();

describe('regular-indexes module', function () {
  let store: ReturnType<typeof setupStore>;

  beforeEach(function () {
    store = setupStore();
  });

  it('#setRegularIndexes action - it only sets indexes and does not sort them', function () {
    {
      store.dispatch(setRegularIndexes([]));
      expect(store.getState().regularIndexes.indexes).to.deep.equal([]);
    }

    {
      store.dispatch(setRegularIndexes(defaultSortedIndexes as any));
      expect(store.getState().regularIndexes.indexes).to.deep.equal(
        defaultSortedIndexes
      );
    }

    {
      store.dispatch(setRegularIndexes(usageSortedDesc as any));
      expect(store.getState().regularIndexes.indexes).to.deep.equal(
        usageSortedDesc
      );
    }
  });

  it('#sortRegularIndexes action - it sorts indexes as defined', function () {
    store.dispatch(setRegularIndexes(defaultSortedDesc as any));

    {
      store.dispatch(sortRegularIndexes('Name and Definition', 'asc'));
      const state = store.getState().regularIndexes;
      expect(state.sortColumn).to.equal('Name and Definition');
      expect(state.sortOrder).to.equal('asc');
      expect(state.indexes).to.deep.equal(defaultSortedIndexes);
    }

    {
      store.dispatch(sortRegularIndexes('Name and Definition', 'desc'));
      const state = store.getState().regularIndexes;
      expect(state.sortColumn).to.equal('Name and Definition');
      expect(state.sortOrder).to.equal('desc');
      expect(state.indexes).to.deep.equal(defaultSortedDesc);
    }

    {
      store.dispatch(sortRegularIndexes('Usage', 'asc'));
      const state = store.getState().regularIndexes;
      expect(state.sortColumn).to.equal('Usage');
      expect(state.sortOrder).to.equal('asc');
      expect(state.indexes).to.deep.equal(usageSortedIndexes);
    }

    {
      store.dispatch(sortRegularIndexes('Usage', 'desc'));
      const state = store.getState().regularIndexes;
      expect(state.sortColumn).to.equal('Usage');
      expect(state.sortOrder).to.equal('desc');
      expect(state.indexes).to.deep.equal(usageSortedDesc);
    }
  });

  describe('#fetchIndexes action', function () {
    it('sets indexes to empty array for views', async function () {
      const indexesSpy = Sinon.spy();
      const store = setupStore({
        dataProvider: {
          dataProvider: {
            isConnected() {
              return true;
            },
            indexes: indexesSpy,
          } as any,
        },
      });

      // Add indexes in the store
      store.dispatch(setRegularIndexes(defaultSortedIndexes as any));
      store.dispatch(readonlyViewChanged(true));

      await store.dispatch(fetchIndexes());

      expect(store.getState().regularIndexes.indexes).to.have.lengthOf(0);
      expect(indexesSpy.callCount).to.equal(0);
    });

    it('when dataService is not connected, sets refreshing to false', async function () {
      const store = setupStore({
        dataProvider: {
          dataProvider: {
            isConnected() {
              return false;
            },
          } as any,
        },
      });
      store.dispatch({
        type: ActionTypes.IndexesAdded,
        indexes: defaultSortedIndexes,
      });
      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;
      expect(state.indexes).to.deep.equal(defaultSortedIndexes);
      expect(state.isRefreshing).to.equal(false);
    });

    it('sets indexes to empty array when there is an error', async function () {
      const error = new Error('failed to connect to server');
      const store = setupStore({
        dataProvider: {
          dataProvider: {
            isConnected() {
              return true;
            },
            indexes: () => Promise.reject(error),
          } as any,
        },
      });
      // Set some data to validate the empty array condition
      store.dispatch({
        type: ActionTypes.IndexesAdded,
        indexes: defaultSortedIndexes,
      });

      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;
      expect(state.indexes).to.deep.equal([]);
      expect(state.error).to.equal(error.message);
      expect(state.isRefreshing).to.equal(false);
    });

    it('sets indexes when fetched successfully with default sort', async function () {
      const store = setupStore({
        dataProvider: {
          dataProvider: {
            isConnected() {
              return true;
            },
            indexes: () => Promise.resolve(defaultSortedDesc),
          } as any,
        },
      });
      // Set indexes to empty
      store.dispatch(setRegularIndexes([]));
      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;
      expect(state.indexes).to.deep.eq(defaultSortedIndexes);
      expect(state.error).to.be.null;
      expect(state.isRefreshing).to.equal(false);
    });

    it('sets indexes when fetched successfully with custom sort', async function () {
      const store = setupStore({
        dataProvider: {
          dataProvider: {
            isConnected() {
              return true;
            },
            indexes: () => Promise.resolve(usageSortedIndexes),
          } as any,
        },
      });
      // Set indexes to empty
      store.dispatch(setRegularIndexes([]));
      store.dispatch(sortRegularIndexes('Usage', 'desc'));

      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;
      expect(state.indexes).to.deep.eq(usageSortedDesc);
      expect(state.error).to.be.null;
      expect(state.isRefreshing).to.equal(false);
    });

    it('merges with in progress indexes', async function () {
      const store = setupStore({
        dataProvider: {
          dataProvider: {
            isConnected() {
              return true;
            },
            indexes: () => Promise.resolve(indexesList),
          } as any,
        },
      });

      // Set indexes to empty
      store.dispatch(setRegularIndexes([]));
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

      await store.dispatch(fetchIndexes());

      const state = store.getState().regularIndexes;

      expect(state.indexes.length).to.equal(defaultSortedIndexes.length + 1);

      const indexes = state.indexes.filter(
        (index: any) => index.extra.status === 'inprogress'
      );

      expect(indexes).to.deep.equal(inProgressIndexes);

      expect(state.error).to.be.null;
      expect(state.isRefreshing).to.equal(false);
    });
  });

  describe('#refreshRegularIndexes action', function () {
    it('sets isRefreshing when indexes are refreshed', async function () {
      const store = setupStore({
        dataProvider: {
          dataProvider: {
            isConnected() {
              return true;
            },
            indexes: async () => {
              await wait(100);
              return defaultSortedIndexes;
            },
          } as any,
        },
      });

      store.dispatch(refreshRegularIndexes() as any);
      expect(store.getState().regularIndexes.isRefreshing).to.be.true;

      await wait(100);
      expect(store.getState().regularIndexes.isRefreshing).to.be.false;
      expect(store.getState().regularIndexes.indexes).to.deep.equal(
        defaultSortedIndexes
      );
    });
  });

  describe('handles inprogress indexes', function () {
    const inProgIndex = inProgressIndexes[0];

    beforeEach(function () {
      expect(
        store.getState().regularIndexes.inProgressIndexes
      ).to.have.lengthOf(0);
      store.dispatch(inProgressIndexAdded(inProgIndex as any));
      expect(
        store.getState().regularIndexes.inProgressIndexes
      ).to.have.lengthOf(1);
    });

    it('#inProgressIndexAdded', function () {
      expect(store.getState().regularIndexes.inProgressIndexes).to.deep.equal([
        inProgIndex,
      ]);
    });

    it('#inProgressIndexRemoved', function () {
      store.dispatch(inProgressIndexRemoved(inProgIndex.id!));
      expect(
        store.getState().regularIndexes.inProgressIndexes
      ).to.have.lengthOf(0);
    });

    it('#inProgressIndexFailed', function () {
      store.dispatch(
        inProgressIndexFailed({
          inProgressIndexId: inProgIndex.id!,
          error: 'Something went wrong',
        })
      );

      const [failedIndex] = store.getState().regularIndexes.inProgressIndexes;
      expect(failedIndex).to.deep.equal({
        ...inProgIndex,
        extra: {
          status: 'failed',
          error: 'Something went wrong',
        },
      });
    });
  });
});
