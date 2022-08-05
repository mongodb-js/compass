import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  wildcardProjectionChanged,
  WILDCARD_PROJECTION_CHANGED,
} from '../create-index/wildcard-projection';

describe('create index wildcard projection module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(
            undefined,
            wildcardProjectionChanged("{ testkey: 'testvalue' }")
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

  describe('#wildcardProjectionChanged', function () {
    it('returns the action', function () {
      expect(
        wildcardProjectionChanged("{ testkey: 'testvalue' }")
      ).to.deep.equal({
        type: WILDCARD_PROJECTION_CHANGED,
        wildcardProjection: "{ testkey: 'testvalue' }",
      });
    });
  });
});
