import reducer, {
  INITIAL_STATE,
  toggleIsConnected,
  TOGGLE_IS_CONNECTED
} from 'modules/is-connected';

describe('is-connected module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsConnected(false))).to.equal(false);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsConnected', () => {
    it('returns the action', () => {
      expect(toggleIsConnected(true)).to.deep.equal({
        type: TOGGLE_IS_CONNECTED,
        isConnected: true
      });
    });
  });
});
