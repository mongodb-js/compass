import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  ttlChanged,
  TTL_CHANGED,
} from '../create-index/ttl';

describe('create index partial filter expression module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, ttlChanged(1000))).to.deep.equal(1000);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#ttlChanged', function () {
    it('returns the action', function () {
      expect(ttlChanged(1000)).to.deep.equal({
        type: TTL_CHANGED,
        ttl: 1000,
      });
    });
  });
});
