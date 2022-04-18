import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  changeWildcardProjection,
  CHANGE_WILDCARD_PROJECTION
} from '../create-index/wildcard-projection';

describe('create index wildcard projection module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(
          reducer(undefined, changeWildcardProjection({'testkey': 'testvalue'}))
        ).to.deep.equal({'testkey': 'testvalue'});
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeWildcardProjection', function() {
    it('returns the action', function() {
      expect(changeWildcardProjection({'testkey': 'testvalue'})).to.deep.equal({
        type: CHANGE_WILDCARD_PROJECTION,
        wildcardProjection: {'testkey': 'testvalue'}
      });
    });
  });
});
