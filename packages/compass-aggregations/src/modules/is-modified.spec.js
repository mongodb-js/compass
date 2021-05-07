import reducer, { setIsModified, SET_IS_MODIFIED } from 'modules/is-modified';

describe('isModified module', () => {
  describe('#setIsModified', () => {
    it('returns the SET_IS_MODIFIED action', () => {
      expect(setIsModified(true)).to.deep.equal({
        type: SET_IS_MODIFIED,
        isModified: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not set is modified', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is set is modified', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, setIsModified(true))).to.equal(true);
      });
    });
  });
});
