import reducer from './is-modified';
import { expect } from 'chai';

describe('isModified module', function() {
  describe('#reducer', function() {
    context('when the action is not set is modified', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });
  });
});
