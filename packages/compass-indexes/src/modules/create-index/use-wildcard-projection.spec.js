import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleUseWildcardProjection,
  TOGGLE_USE_WILDCARD_PROJECTION,
} from '../create-index/use-wildcard-projection';

describe('create index use wildcard projection module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleUseWildcardProjection(true))).to.equal(
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

  describe('#toggleUseWildcardProjection', function () {
    it('returns the action', function () {
      expect(toggleUseWildcardProjection(false)).to.deep.equal({
        type: TOGGLE_USE_WILDCARD_PROJECTION,
        useWildcardProjection: false,
      });
    });
  });
});
