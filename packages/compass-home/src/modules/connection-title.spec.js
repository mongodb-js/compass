import reducer, {
  INITIAL_STATE,
  changeConnectionTitle,
  CHANGE_CONNECTION_TITLE
} from 'modules/connection-title';

describe('connection-title module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeConnectionTitle('new connectionTitle'))).to.equal('new connectionTitle');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeConnectionTitle', () => {
    it('returns the action', () => {
      expect(changeConnectionTitle('new connectionTitle w action')).to.deep.equal({
        type: CHANGE_CONNECTION_TITLE,
        connectionTitle: 'new connectionTitle w action'
      });
    });
  });
});
