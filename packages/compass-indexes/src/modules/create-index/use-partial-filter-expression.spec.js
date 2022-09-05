import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleUsePartialFilterExpression,
  TOGGLE_USE_PARTIAL_FILTER_EXPRESSION,
} from '../create-index/use-partial-filter-expression';

describe('create index use partial filter expression module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, toggleUsePartialFilterExpression(true))
        ).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleUsePartialFilterExpression', function () {
    it('returns the action', function () {
      expect(toggleUsePartialFilterExpression(false)).to.deep.equal({
        type: TOGGLE_USE_PARTIAL_FILTER_EXPRESSION,
        usePartialFilterExpression: false,
      });
    });
  });
});
