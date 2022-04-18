import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsPartialFilterExpression,
  TOGGLE_IS_PARTIAL_FILTER_EXPRESSION
} from '../create-index/is-partial-filter-expression';

describe('create index is partial filter expression module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleIsPartialFilterExpression(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsPartialFilterExpression', function() {
    it('returns the action', function() {
      expect(toggleIsPartialFilterExpression(false)).to.deep.equal({
        type: TOGGLE_IS_PARTIAL_FILTER_EXPRESSION,
        isPartialFilterExpression: false
      });
    });
  });
});
