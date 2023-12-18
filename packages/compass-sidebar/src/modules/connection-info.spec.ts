import { expect } from 'chai';
import sinon from 'sinon';

import reducer, {
  INITIAL_STATE,
  changeConnectionInfo,
  updateAndSaveConnectionInfo,
} from './connection-info';

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
          reducer(undefined, changeConnectionInfo(connectionInfoNotFavorite))
            .connectionInfo
        ).to.deep.equal(connectionInfoNotFavorite);
      });

      it('does not call the connection storage to save', function () {
        const saveSpy = sinon.spy();
        reducer(
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
      it('returns the new state', function () {
        const newConnection = updateAndSaveConnectionInfo({
          ...connectionInfoNotFavorite,
          favorite: {
            name: 'My Favorite',
            color: '#d4366e',
          },
        });
        const state = reducer(
          {
            connectionStorage: {
              save: function () {},
            },
          } as any,
          newConnection
        );

        expect(state.connectionInfo.favorite?.name).to.equal('My Favorite');
        expect(state.connectionInfo.favorite?.color).to.equal('#d4366e');
      });

      it('calls to save the connection info in the connection storage', function () {
        const newConnection = updateAndSaveConnectionInfo({
          ...connectionInfoNotFavorite,
          favorite: {
            name: 'My Favorite',
            color: '#d4366e',
          },
        });
        const saveSpy = sinon.spy();
        reducer(
          {
            connectionStorage: {
              save: saveSpy,
            },
          } as any,
          newConnection
        );

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
        expect(reducer(undefined, {} as any)).to.equal(INITIAL_STATE);
      });
    });
  });
});
