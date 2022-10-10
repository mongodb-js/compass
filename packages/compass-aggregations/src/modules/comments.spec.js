import reducer from './comments';
import { expect } from 'chai';

describe('comments module', function() {
  describe('#reducer', function() {
    context('when the action is not toggle comments', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });
  });
});
