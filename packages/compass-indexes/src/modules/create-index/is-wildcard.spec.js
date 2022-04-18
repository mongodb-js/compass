import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsWildcard,
  TOGGLE_IS_WILDCARD
} from '../create-index/is-wildcard';

describe('create index is wildcard module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleIsWildcard(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsWildcard', function() {
    it('returns the action', function() {
      expect(toggleIsWildcard(false)).to.deep.equal({
        type: TOGGLE_IS_WILDCARD,
        isWildcard: false
      });
    });
  });
});
