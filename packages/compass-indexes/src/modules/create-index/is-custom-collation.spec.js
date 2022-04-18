import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsCustomCollation,
  TOGGLE_IS_CUSTOM_COLLATION
} from '../create-index/is-custom-collation';

describe('create index is custom collation module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleIsCustomCollation(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsCustomCollation', function() {
    it('returns the action', function() {
      expect(toggleIsCustomCollation(false)).to.deep.equal({
        type: TOGGLE_IS_CUSTOM_COLLATION,
        isCustomCollation: false
      });
    });
  });
});
