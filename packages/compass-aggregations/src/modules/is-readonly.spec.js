import reducer, { isReadonlyChanged, IS_READONLY_CHANGED } from './is-readonly';
import { expect } from 'chai';

describe('isReadonly module', function() {
  describe('#isReadonlyChanged', function() {
    it('returns the IS_READONLY_CHANGED action', function() {
      expect(isReadonlyChanged(true)).to.deep.equal({
        type: IS_READONLY_CHANGED,
        isReadonly: true
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not readonly changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is readonly changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, isReadonlyChanged(true))).to.equal(true);
      });
    });
  });
});
