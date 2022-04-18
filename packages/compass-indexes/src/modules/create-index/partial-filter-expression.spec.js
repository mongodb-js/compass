import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changePartialFilterExpression,
  CHANGE_PARTIAL_FILTER_EXPRESSION
} from '../create-index/partial-filter-expression';

describe('create index partial filter expression module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(
          reducer(undefined, changePartialFilterExpression({'testkey': 'testvalue'}))
        ).to.deep.equal({'testkey': 'testvalue'});
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changePartialFilterExpression', function() {
    it('returns the action', function() {
      expect(changePartialFilterExpression({'testkey': 'testvalue'})).to.deep.equal({
        type: CHANGE_PARTIAL_FILTER_EXPRESSION,
        partialFilterExpression: {'testkey': 'testvalue'}
      });
    });
  });
});
