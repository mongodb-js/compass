import reducer, { isReadonlyChanged, IS_READONLY_CHANGED } from './is-readonly';

describe('isReadonly module', () => {
  describe('#isReadonlyChanged', () => {
    it('returns the IS_READONLY_CHANGED action', () => {
      expect(isReadonlyChanged(true)).to.deep.equal({
        type: IS_READONLY_CHANGED,
        isReadonly: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not readonly changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is readonly changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, isReadonlyChanged(true))).to.equal(true);
      });
    });
  });
});
