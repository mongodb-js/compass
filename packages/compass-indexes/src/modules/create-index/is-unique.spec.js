import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsUnique,
  TOGGLE_IS_UNIQUE
} from '../create-index/is-unique';

describe('create index is unique module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleIsUnique(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsUnique', function() {
    it('returns the action', function() {
      expect(toggleIsUnique(false)).to.deep.equal({
        type: TOGGLE_IS_UNIQUE,
        isUnique: false
      });
    });
  });
});
