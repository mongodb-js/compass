import reducer, {
  INITIAL_STATE,
  toggleIsVisible,
  TOGGLE_IS_VISIBLE
} from 'modules/is-visible';

describe('drop/create index is visible module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsVisible(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsVisible', () => {
    it('returns the action', () => {
      expect(toggleIsVisible(false)).to.deep.equal({
        type: TOGGLE_IS_VISIBLE,
        isVisible: false
      });
    });
  });
});
