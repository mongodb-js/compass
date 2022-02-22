import reducer, { setIsModified, SET_IS_MODIFIED } from './is-modified';
import { expect } from 'chai';

describe('isModified module', function() {
  describe('#setIsModified', function() {
    it('returns the SET_IS_MODIFIED action', function() {
      expect(setIsModified(true)).to.deep.equal({
        type: SET_IS_MODIFIED,
        isModified: true
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not set is modified', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is set is modified', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, setIsModified(true))).to.equal(true);
      });
    });
  });
});
