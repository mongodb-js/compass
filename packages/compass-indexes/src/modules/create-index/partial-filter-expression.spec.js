import reducer, {
  INITIAL_STATE,
  changePartialFilterExpression,
  CHANGE_PARTIAL_FILTER_EXPRESSION
} from 'modules/create-index/partial-filter-expression';

describe('create index partial filter expression module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(
          reducer(undefined, changePartialFilterExpression({'testkey': 'testvalue'}))
        ).to.deep.equal({'testkey': 'testvalue'});
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changePartialFilterExpression', () => {
    it('returns the action', () => {
      expect(changePartialFilterExpression({'testkey': 'testvalue'})).to.deep.equal({
        type: CHANGE_PARTIAL_FILTER_EXPRESSION,
        partialFilterExpression: {'testkey': 'testvalue'}
      });
    });
  });
});
