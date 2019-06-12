import reducer, {
  INITIAL_STATE,
  toggleIsWildcard,
  TOGGLE_IS_WILDCARD
} from 'modules/create-index/is-wildcard';

describe('create index is wildcard module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsWildcard(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsWildcard', () => {
    it('returns the action', () => {
      expect(toggleIsWildcard(false)).to.deep.equal({
        type: TOGGLE_IS_WILDCARD,
        isWildcard: false
      });
    });
  });
});
