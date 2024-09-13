import { expect } from 'chai';
import { setTimeout as wait } from 'timers/promises';
import Sinon from 'sinon';
import {
  fetchIndexes,
  refreshRegularIndexes,
  //failedIndexRemoved,
  //dropIndex,
  //hideIndex,
  //unhideIndex
} from './regular-indexes';
import {
  indexesList,
  defaultSortedIndexes,
  //usageSortedIndexes,
  inProgressIndexes,
} from '../../test/fixtures/regular-indexes';
import { readonlyViewChanged } from './is-readonly-view';
import { setupStore } from '../../test/setup-store';

describe.only('regular-indexes module', function () {
  describe('#fetchIndexes action', function () {
    it('sets indexes to empty array for views', async function () {
      const indexesSpy = Sinon.spy();
      const store = setupStore(
        {},
        {
          indexes: indexesSpy,
        }
      );

      Object.assign(store.getState().regularIndexes, {
        indexes: defaultSortedIndexes.map((index) => ({ ...index })),
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
      Object.assign(store.getState().regularIndexes, {
        indexes: defaultSortedIndexes.slice(),
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

      Object.assign(store.getState().regularIndexes, {
        inProgressIndexes: inProgressIndexes.slice(),
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

  describe.only('#refreshRegularIndexes action', function () {
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

      console.dir(store.getState().regularIndexes, { depth: null });

      store.dispatch(refreshRegularIndexes());
      expect(store.getState().regularIndexes.isRefreshing).to.be.true;

      await wait(100);
      expect(store.getState().regularIndexes.isRefreshing).to.be.false;
      expect(store.getState().regularIndexes.indexes).to.deep.equal(
        defaultSortedIndexes
      );
    });
  });

  //describe('#failedIndexRemoved');
  //describe('#dropIndex (thunk)');
  //describe('#hideIndex (thunk)');
  //describe('#unhideIndex (thunk)');
});
