import reducer, {
  INITIAL_STATE,
  changeAuthentication,
  CHANGE_AUTHENTICATION
} from 'modules/authentication';

describe('authentication module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeAuthentication('new authentication'))).to.equal('new authentication');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeAuthentication', () => {
    it('returns the action', () => {
      expect(changeAuthentication('new authentication w action')).to.deep.equal({
        type: CHANGE_AUTHENTICATION,
        authentication: 'new authentication w action'
      });
    });
  });
});
