import databasesReducer, {
  INITIAL_STATE,
  changeDatabases,
  changeActiveNamespace,
  changeFilterRegex
} from './databases';

import { createInstance } from '../../test/helpers';

function createGetState(dbs) {
  return function() {
    return {
      instance: createInstance(dbs).toJSON()
    };
  };
}

function createDatabases(dbs) {
  return createInstance(dbs).toJSON().databases;
}

function createMockStoreSlice(
  initialState = {},
  reducer = databasesReducer
) {
  let state = { ...INITIAL_STATE, ...initialState };
  return {
    get state() {
      return state;
    },
    dispatch(action) {
      state = reducer(state, action);
    },
  };
}

describe('sidebar databases', () => {
  describe('#reducer', () => {
    context('when changing databases and no filter is set', () => {
      it('sets databases as-is', () => {
        const dbs = createDatabases([{ _id: 'foo' }, { _id: 'bar' }]);

        expect(databasesReducer(undefined, changeDatabases(dbs))).to.deep.equal(
          {
            ...INITIAL_STATE,
            databases: [
              { _id: 'foo', collections: [] },
              { _id: 'bar', collections: [] },
            ],
          }
        );
      });
    });

    context('when changing databases and there is a filter in the state', () => {
      it('filters databases in the state', () => {
        const initialState = {
          ...INITIAL_STATE,
          filterRegex: /^foo$/,
        };

        const dbs = createDatabases([{ _id: 'foo' }, { _id: 'bar' }, { _id: 'buz' }]);

        expect(
          databasesReducer(initialState, changeDatabases(dbs))
        ).to.deep.equal({
          ...initialState,
          databases: [{ _id: 'foo', collections: [] }],
        });
      });
    });

    context('when active namespace changed', () => {
      it('changes active namespace and "expands" the namespace in the list', () => {
        expect(
          databasesReducer(undefined, changeActiveNamespace('new_active.namespace'))
        ).to.deep.equal({
          ...INITIAL_STATE,
          activeNamespace: 'new_active.namespace',
          expandedDbList: {
            new_active: true,
          },
        });
      });
    });

    context('when filter changed', () => {
      it('filters and updates the databases and collections', () => {
        const getState = createGetState([
          { _id: 'foo' },
          { _id: 'bar', collections: ['foo'] },
          { _id: 'bla', collections: ['123'] },
        ]);

        const slice = createMockStoreSlice();

        changeFilterRegex(/^foo$/)(slice.dispatch, getState);

        expect(slice.state).to.deep.eq({
          ...INITIAL_STATE,
          filterRegex: /^foo$/,
          databases: [
            {
              _id: 'foo',
              collections: [],
            },
            {
              _id: 'bar',
              collections: [
                {
                  _id: 'bar.foo',
                  name: 'foo',
                  database: 'bar',
                  capped: false,
                  readonly: false,
                },
              ],
            },
          ],
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(databasesReducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
