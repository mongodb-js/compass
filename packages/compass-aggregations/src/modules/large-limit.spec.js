import reducer, {
  largeLimitChanged,
  LARGE_LIMIT_CHANGED
} from './large-limit';
import { expect } from 'chai';

describe('large-limit module', function() {
  describe('#limitChanged', function() {
    it('returns the LARGE_LIMIT_CHANGED action', function() {
      expect(largeLimitChanged(100)).to.deep.equal({
        type: LARGE_LIMIT_CHANGED,
        largeLimit: 100
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not limit changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(100000);
      });
    });

    context('when the action is limit changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, largeLimitChanged(100))).to.equal(100);
      });
    });
  });
});
