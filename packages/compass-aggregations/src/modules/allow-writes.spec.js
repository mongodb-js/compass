import reducer, { allowWrites, ALLOW_WRITES } from './allow-writes';
import { expect } from 'chai';

describe('allowWrites module', function() {
  describe('#allowWrites', function() {
    it('returns the ALLOW_WRITES action', function() {
      expect(allowWrites(true)).to.deep.equal({
        type: ALLOW_WRITES,
        allowWrites: true
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not allow writes', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is set allow writes', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, allowWrites(false))).to.equal(false);
      });
    });
  });
});
