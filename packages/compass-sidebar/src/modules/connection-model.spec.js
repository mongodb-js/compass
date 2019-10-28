import reducer, {
  INITIAL_STATE,
  CHANGE_CONNECTION,
  DELETE_FAVORITE,
  SAVE_FAVORITE,
  changeConnection,
  saveFavorite,
  deleteFavorite
} from 'modules/connection-model';

describe('connection module', () => {
  const connection = {
    hostname: '127.0.0.1',
    port: 27017,
    isFavorite: false,
    name: 'Local',
    save: () => {},
    destroy: () => {},
    set(favorite) {
      this.name = favorite.name;
      this.color = favorite.color;
      this.isFavorite = favorite.isFavorite;
    }
  };

  describe('reducer', () => {
    context('when the action is changeConnection', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeConnection(connection))).to.deep.equal({
          connection
        });
      });
    });

    context('when the action is saveFavorite', () => {
      it('returns the new state', () => {
        const newConnection = saveFavorite(connection, 'My Favorite', '#d4366e');
        const state = reducer(undefined, newConnection);

        expect(state.connection.name).to.equal('My Favorite');
        expect(state.connection.color).to.equal('#d4366e');
        expect(state.connection.isFavorite).to.equal(true);
      });
    });

    context('when the action is deleteFavorite', () => {
      it('returns the new state', () => {
        const newConnection = deleteFavorite(connection);
        const state = reducer(undefined, newConnection);

        expect(state.connection.name).to.equal('');
        expect(state.connection.color).to.equal(undefined);
        expect(state.connection.isFavorite).to.equal(false);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeConnection', () => {
    context('when the connection is a favourite', () => {
      it('sets the favourite name in the action', () => {
        const favourite = { ...connection, isFavorite: true, name: 'New name' };

        expect(changeConnection(favourite)).to.deep.equal({
          type: CHANGE_CONNECTION,
          connection: favourite
        });
      });
    });

    context('when the favourite connection should be updated', () => {
      it('sets the favourite name, color and isFavorite flag', () => {
        const name = 'Simple connection';
        const color = '#59c1e2';

        expect(saveFavorite(connection, name, color)).to.deep.equal({
          type: SAVE_FAVORITE,
          connection,
          name,
          color
        });
      });
    });

    context('when the connection should be deleted from favorites', () => {
      it('clears the favourite name, color and isFavorite flag', () => {
        expect(deleteFavorite(connection)).to.deep.equal({
          type: DELETE_FAVORITE,
          connection
        });
      });
    });
  });
});
