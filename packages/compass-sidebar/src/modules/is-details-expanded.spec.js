import reducer, {
  INITIAL_STATE,
  toggleIsDetailsExpanded,
  TOGGLE_IS_DETAILS_EXPANDED
} from 'modules/is-details-expanded';

describe('sidebar isDetailsExpanded', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsDetailsExpanded(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsExpanded', () => {
    it('returns the action', () => {
      expect(toggleIsDetailsExpanded(false)).to.deep.equal({
        type: TOGGLE_IS_DETAILS_EXPANDED,
        isExpanded: false
      });
    });
  });
});
