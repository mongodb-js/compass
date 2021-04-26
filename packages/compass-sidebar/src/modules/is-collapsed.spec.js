import reducer, {
  INITIAL_STATE,
  toggleIsCollapsed,
  TOGGLE_IS_COLLAPSED
} from 'modules/is-collapsed';

describe('sidebar isCollapsed', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsCollapsed(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsCollapsed', () => {
    it('returns the action', () => {
      expect(toggleIsCollapsed(false)).to.deep.equal({
        type: TOGGLE_IS_COLLAPSED,
        isCollapsed: false
      });
    });
  });
});
