import reducer, {
  INITIAL_STATE,
  toggleInProgress,
  TOGGLE_IN_PROGRESS
} from 'modules/in-progress';

describe('drop index is running module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleInProgress(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleInProgress', () => {
    it('returns the action', () => {
      expect(toggleInProgress(false)).to.deep.equal({
        type: TOGGLE_IN_PROGRESS,
        inProgress: false
      });
    });
  });
});
