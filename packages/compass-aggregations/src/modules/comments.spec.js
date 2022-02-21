import reducer, { toggleComments, TOGGLE_COMMENTS } from './comments';
import { expect } from 'chai';

describe('comments module', function() {
  describe('#toggleComments', function() {
    it('returns the TOGGLE_COMMENTS action', function() {
      expect(toggleComments()).to.deep.equal({
        type: TOGGLE_COMMENTS
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not toggle comments', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is toggle comments', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleComments())).to.equal(false);
      });
    });
  });
});
