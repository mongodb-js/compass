import reducer, { limitChanged, LIMIT_CHANGED } from './limit';
import { expect } from 'chai';

describe('limit module', function() {
  describe('#limitChanged', function() {
    it('returns the LIMIT_CHANGED action', function() {
      expect(limitChanged(100)).to.deep.equal({
        type: LIMIT_CHANGED,
        limit: 100
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not limit changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(10);
      });
    });

    context('when the action is limit changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, limitChanged(100))).to.equal(100);
      });
    });
  });
});
