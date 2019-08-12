import reducer, {
  INITIAL_STATE,
  CHANGE_CONNECTION_NAME,
  changeConnectionName
} from 'modules/connection-name';

describe('connection-name module', () => {
  const favourite = { is_favorite: true, name: 'testing' };
  const connection = { is_favorite: false };

  describe('reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeConnectionName(favourite))).to.equal('testing');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeConnectionName', () => {
    context('when the connection is a favourite', () => {
      it('sets the favourite name in the action', () => {
        expect(changeConnectionName(favourite)).to.deep.equal({
          type: CHANGE_CONNECTION_NAME,
          name: 'testing'
        });
      });
    });

    context('when the connection is not a favourite', () => {
      it('sets the favourite name in the action', () => {
        expect(changeConnectionName(connection)).to.deep.equal({
          type: CHANGE_CONNECTION_NAME,
          name: INITIAL_STATE
        });
      });
    });
  });
});
