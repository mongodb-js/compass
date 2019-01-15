import reducer, {
  INITIAL_STATE,
  toggleIsRunning,
  TOGGLE_IS_RUNNING
} from 'modules/is-running';

describe('drop database is running module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsRunning(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsRunning', () => {
    it('returns the action', () => {
      expect(toggleIsRunning(false)).to.deep.equal({
        type: TOGGLE_IS_RUNNING,
        isRunning: false
      });
    });
  });
});
