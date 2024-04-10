import type { RootAction } from './';
import { expect } from 'chai';

import databasesReducer, {
  INITIAL_STATE,
  changeDatabases,
  changeFilterRegex,
} from './databases';

import { createInstance } from '../../test/helpers';

const CONNECTION_ID = 'webscale';

function createGetState(dbs: any[] = []) {
  return function () {
    return {
      instance: {
        [CONNECTION_ID]: createInstance(dbs).toJSON(),
      },
      databases: {
        [CONNECTION_ID]: {},
      },
      appRegistry: { localAppRegistry: null, globalAppRegistry: null },
    };
  };
}

function createDatabases(dbs: any[] = []) {
  return createInstance(dbs).databases.map((db) => {
    return {
      ...db.toJSON(),
      collections: db.collections.toJSON(),
    };
  });
}

function createMockStoreSlice(initialState = {}, reducer = databasesReducer) {
  let state = { ...INITIAL_STATE, ...initialState };
  return {
    get state() {
      return state;
    },
    dispatch(action: RootAction) {
      state = reducer(state, action);
    },
  } as any;
}

describe('sidebar databases', function () {
  describe('#reducer', function () {
    context('when changing databases and no filter is set', function () {
      it('sets databases as-is', function () {
        const dbs = createDatabases([{ _id: 'foo' }, { _id: 'bar' }]);

        expect(
          databasesReducer(undefined, changeDatabases(CONNECTION_ID, dbs))
        ).to.deep.equal({
          [CONNECTION_ID]: {
            ...INITIAL_STATE,
            databases: dbs,
            filteredDatabases: dbs,
          },
        });
      });
    });

    context(
      'when changing databases and there is a filter in the state',
      function () {
        it('filters databases in the state', function () {
          const initialState = {
            ...INITIAL_STATE,
            filterRegex: /^foo$/,
          };

          const dbs = createDatabases([
            { _id: 'foo' },
            { _id: 'bar' },
            { _id: 'buz' },
          ]);

          expect(
            databasesReducer(
              { [CONNECTION_ID]: { ...initialState } },
              changeDatabases(CONNECTION_ID, dbs)
            )
          ).to.deep.equal({
            [CONNECTION_ID]: {
              ...initialState,
              filteredDatabases: dbs.filter((db) => db._id === 'foo'),
              databases: dbs,
            },
          });
        });
      }
    );

    context('when filter changed', function () {
      it('filters and updates the databases and collections', function () {
        const getState = createGetState();

        const dbs = createDatabases([
          { _id: 'foo' },
          { _id: 'bar', collections: ['foo'] },
          { _id: 'bla', collections: ['123'] },
        ]);

        const slice = createMockStoreSlice({
          [CONNECTION_ID]: {
            databases: dbs,
          },
        });

        changeFilterRegex(/^foo$/)(slice.dispatch, getState as any, {
          globalAppRegistry: {
            emit() {
              // noop
            },
          } as any,
        });

        expect(slice.state).to.deep.eq({
          [CONNECTION_ID]: {
            ...INITIAL_STATE,
            filterRegex: /^foo$/,
            databases: dbs,
            expandedDbList: {},
            filteredDatabases: dbs.filter(
              (db) =>
                db._id === 'foo' ||
                db.collections.find((coll) => coll._id === 'bar.foo')
            ),
          },
        });
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(databasesReducer(undefined, {} as any)).to.equal(INITIAL_STATE);
      });
    });
  });
});
