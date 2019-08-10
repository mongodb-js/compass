import reducer, { setIsReadonly, SET_IS_READONLY } from 'modules/is-readonly';

describe('isReadonly module', () => {
  describe('#setIsReadonly', () => {
    it('returns the SET_IS_READONLY action', () => {
      expect(setIsReadonly(true)).to.deep.equal({
        type: SET_IS_READONLY,
        isReadonly: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not set is readonly', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is set is readonly', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, setIsReadonly(true))).to.equal(true);
      });
    });
  });
});
