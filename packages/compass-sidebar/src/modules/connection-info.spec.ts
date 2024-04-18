import { expect } from 'chai';
import sinon from 'sinon';

import connectionInfoReducer, {
  INITIAL_STATE,
  changeConnectionInfo,
  updateAndSaveConnectionInfo,
} from './connection-info';
import { InMemoryConnectionStorage } from '@mongodb-js/connection-storage/provider';
import { AppRegistry } from 'hadron-app-registry';
import type { RootAction } from '.';

function createMockStoreSlice(
  initialState = {},
  reducer = connectionInfoReducer
) {
  let state = { ...INITIAL_STATE, ...initialState };
  return {
    getState() {
      return state;
    },
    dispatch(action: RootAction) {
      state = reducer(state, action);
    },
  } as any;
}

describe('connection info module', function () {
  const connectionInfoNotFavorite = {
    connectionOptions: {
      connectionString: 'mongodb://outerspace:27000',
    },
    id: '123',
  };

  describe('reducer', function () {
    context('when the action is changeConnectionInfo', function () {
      it('returns the new state', function () {
        expect(
          connectionInfoReducer(
            undefined,
            changeConnectionInfo(connectionInfoNotFavorite)
          ).connectionInfo
        ).to.deep.equal(connectionInfoNotFavorite);
      });

      it('does not call the connection storage to save', function () {
        const saveSpy = sinon.spy();
        connectionInfoReducer(
          {
            connectionStorage: {
              save: saveSpy,
            },
          } as any,
          changeConnectionInfo(connectionInfoNotFavorite)
        );

        expect(saveSpy.callCount).to.equal(0);
      });
    });

    context('when the action is updateAndSaveConnectionInfo', function () {
      let saveSpy: sinon.SinonSpy;
      let slice: ReturnType<typeof createMockStoreSlice>;
      const globalAppRegistry = new AppRegistry();
      const connectionStorage = new InMemoryConnectionStorage();

      beforeEach(function () {
        saveSpy = sinon.spy(connectionStorage, 'save');
        slice = createMockStoreSlice();
      });

      afterEach(function () {
        sinon.restore();
      });

      it('updates store with new state', function () {
        updateAndSaveConnectionInfo({
          ...connectionInfoNotFavorite,
          favorite: {
            name: 'My Favorite',
            color: '#d4366e',
          },
        })(slice.dispatch.bind(slice), slice.getState.bind(slice), {
          globalAppRegistry,
          connectionStorage,
        });

        expect(slice.getState().connectionInfo.favorite?.name).to.equal(
          'My Favorite'
        );
        expect(slice.getState().connectionInfo.favorite?.color).to.equal(
          '#d4366e'
        );
      });

      it('calls to save the connection info in the connection storage', function () {
        updateAndSaveConnectionInfo({
          ...connectionInfoNotFavorite,
          favorite: {
            name: 'My Favorite',
            color: '#d4366e',
          },
        })(slice.dispatch.bind(slice), slice.getState.bind(slice), {
          globalAppRegistry,
          connectionStorage,
        });

        expect(saveSpy.callCount).to.equal(1);
        expect(saveSpy.firstCall.args[0]).to.deep.equal({
          connectionInfo: {
            connectionOptions: {
              connectionString: 'mongodb://outerspace:27000',
            },
            id: '123',
            favorite: {
              name: 'My Favorite',
              color: '#d4366e',
            },
          },
        });
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(connectionInfoReducer(undefined, {} as any)).to.equal(
          INITIAL_STATE
        );
      });
    });
  });
});
