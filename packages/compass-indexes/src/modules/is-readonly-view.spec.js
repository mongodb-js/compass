import reducer, { readonlyViewChanged, READONLY_VIEW_CHANGED } from 'modules/is-readonly-view';

describe('is readonly view module', () => {
  describe('#reducer', () => {
    context('when an action is not READONLY_VIEW_CHANGED', () => {
      it('returns the state', () => {
        expect(reducer(false, { type: 'test' })).to.equal(false);
      });
    });

    context('when an action is READONLY_VIEW_CHANGED', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, readonlyViewChanged(true))).to.equal(true);
      });
    });
  });

  describe('#readonlyViewChanged', () => {
    it('returns the action', () => {
      expect(readonlyViewChanged(true)).to.deep.equal({
        type: READONLY_VIEW_CHANGED,
        isReadonlyView: true
      });
    });
  });
});
