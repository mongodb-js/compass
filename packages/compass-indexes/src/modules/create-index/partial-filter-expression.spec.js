import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  partialFilterExpressionChanged,
  PARTIAL_FILTER_EXPRESSION_CHANGED,
} from '../create-index/partial-filter-expression';

describe('create index partial filter expression module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(
            undefined,
            partialFilterExpressionChanged("{ testkey: 'testvalue' }")
          )
        ).to.deep.equal("{ testkey: 'testvalue' }");
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#partialFilterExpressionChanged', function () {
    it('returns the action', function () {
      expect(
        partialFilterExpressionChanged("{ testkey: 'testvalue' }")
      ).to.deep.equal({
        type: PARTIAL_FILTER_EXPRESSION_CHANGED,
        partialFilterExpression: "{ testkey: 'testvalue' }",
      });
    });
  });
});
