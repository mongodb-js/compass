import { expect } from 'chai';
import sinon from 'sinon';

import reducer, {
  INITIAL_STATE,
  changeConnectionInfo,
  updateAndSaveConnectionInfo
} from './connection-info';

describe('connection info module', () => {
  const connectionInfoNotFavorite = {
    connectionOptions: {
      connectionString: 'mongodb://outerspace:27000'
    },
    id: '123'
  };

  describe('reducer', () => {
    context('when the action is changeConnectionInfo', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeConnectionInfo(connectionInfoNotFavorite))).to.deep.equal({
          connectionInfo: connectionInfoNotFavorite,
          connectionStorage: {}
        });
      });

      it('does not call the connection storage to save', () => {
        const saveSpy = sinon.spy();
        reducer({
          connectionStorage: {
            save: saveSpy
          }
        }, changeConnectionInfo(connectionInfoNotFavorite));

        expect(saveSpy.callCount).to.equal(0);
      });
    });

    context('when the action is updateAndSaveConnectionInfo', () => {
      it('returns the new state', () => {
        const newConnection = updateAndSaveConnectionInfo({
          ...connectionInfoNotFavorite,
          favorite: {
            name: 'My Favorite',
            color: '#d4366e'
          }
        });
        const state = reducer({
          connectionStorage: {
            save: () => {}
          }
        }, newConnection);

        expect(state.connectionInfo.favorite.name).to.equal('My Favorite');
        expect(state.connectionInfo.favorite.color).to.equal('#d4366e');
      });

      it('calls to save the connection info in the connection storage', () => {
        const newConnection = updateAndSaveConnectionInfo(
          {
            ...connectionInfoNotFavorite,
            favorite: {
              name: 'My Favorite',
              color: '#d4366e'
            }
          }
        );
        const saveSpy = sinon.spy();
        reducer({
          connectionStorage: {
            save: saveSpy
          }
        }, newConnection);

        expect(saveSpy.callCount).to.equal(1);
        expect(saveSpy.firstCall.args[0]).to.deep.equal({
          connectionOptions: {
            connectionString: 'mongodb://outerspace:27000'
          },
          id: '123',
          favorite: {
            name: 'My Favorite',
            color: '#d4366e'
          }
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
