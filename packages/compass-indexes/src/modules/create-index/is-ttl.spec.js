import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsTtl,
  TOGGLE_IS_TTL,
} from '../create-index/is-ttl';

describe('create index is ttl module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsTtl(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsTtl', function () {
    it('returns the action', function () {
      expect(toggleIsTtl(false)).to.deep.equal({
        type: TOGGLE_IS_TTL,
        isTtl: false,
      });
    });
  });
});
