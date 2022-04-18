import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleShowOptions,
  TOGGLE_SHOW_OPTIONS
} from '../create-index/show-options';

describe('create index is options module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleShowOptions(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleShowOptions', function() {
    it('returns the action', function() {
      expect(toggleShowOptions(false)).to.deep.equal({
        type: TOGGLE_SHOW_OPTIONS,
        showOptions: false
      });
    });
  });
});
