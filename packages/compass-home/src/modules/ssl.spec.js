import reducer, {
  INITIAL_STATE,
  changeSsl,
  CHANGE_SSL
} from 'modules/ssl';

describe('ssl module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeSsl('new ssl'))).to.equal('new ssl');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeSsl', () => {
    it('returns the action', () => {
      expect(changeSsl('new ssl w action')).to.deep.equal({
        type: CHANGE_SSL,
        ssl: 'new ssl w action'
      });
    });
  });
});
