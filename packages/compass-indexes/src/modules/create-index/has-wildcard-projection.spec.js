import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleHasWildcardProjection,
  TOGGLE_HAS_WILDCARD_PROJECTION,
} from '../create-index/has-wildcard-projection';

describe('create index has wildcard projection module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleHasWildcardProjection(true))).to.equal(
          true
        );
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleHasWildcardProjection', function () {
    it('returns the action', function () {
      expect(toggleHasWildcardProjection(false)).to.deep.equal({
        type: TOGGLE_HAS_WILDCARD_PROJECTION,
        hasWildcardProjection: false,
      });
    });
  });
});
