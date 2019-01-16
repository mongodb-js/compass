import reducer, {
  INITIAL_STATE,
  toggleIsPartialFilterExpression,
  TOGGLE_IS_PARTIAL_FILTER_EXPRESSION
} from 'modules/create-index/is-partial-filter-expression';

describe('create index is partial filter expression module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsPartialFilterExpression(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsPartialFilterExpression', () => {
    it('returns the action', () => {
      expect(toggleIsPartialFilterExpression(false)).to.deep.equal({
        type: TOGGLE_IS_PARTIAL_FILTER_EXPRESSION,
        isPartialFilterExpression: false
      });
    });
  });
});
