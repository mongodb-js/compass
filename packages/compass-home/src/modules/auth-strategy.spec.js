import reducer, {
  INITIAL_STATE,
  changeAuthStrategy,
  CHANGE_AUTH_STRATEGY
} from 'modules/auth-strategy';

describe('Authentication strategy module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        const authStrategy = 'new authentication strategy';
        const state = reducer(undefined, changeAuthStrategy(authStrategy));

        expect(state).to.equal(authStrategy);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeAuthStrategy', () => {
    it('returns the action', () => {
      const authStrategy = 'new authentication strategy w action';

      expect(changeAuthStrategy(authStrategy)).to.deep.equal({
        type: CHANGE_AUTH_STRATEGY,
        authStrategy: authStrategy
      });
    });
  });
});
