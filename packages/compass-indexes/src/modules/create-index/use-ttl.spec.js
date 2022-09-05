import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleUseTtl,
  TOGGLE_USE_TTL,
} from '../create-index/use-ttl';

describe('create index use ttl module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleUseTtl(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleUseTtl', function () {
    it('returns the action', function () {
      expect(toggleUseTtl(false)).to.deep.equal({
        type: TOGGLE_USE_TTL,
        useTtl: false,
      });
    });
  });
});
