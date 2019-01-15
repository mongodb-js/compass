import reducer, {
  INITIAL_STATE,
  toggleIsCapped,
  TOGGLE_IS_CAPPED
} from 'modules/create-collection/is-capped';

describe('create collection is capped module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsCapped(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsCapped', () => {
    it('returns the action', () => {
      expect(toggleIsCapped(false)).to.deep.equal({
        type: TOGGLE_IS_CAPPED,
        isCapped: false
      });
    });
  });
});
