import reducer, {
  largeLimitChanged,
  LARGE_LIMIT_CHANGED
} from 'modules/large-limit';

describe('large-limit module', () => {
  describe('#limitChanged', () => {
    it('returns the LARGE_LIMIT_CHANGED action', () => {
      expect(largeLimitChanged(100)).to.deep.equal({
        type: LARGE_LIMIT_CHANGED,
        largeLimit: 100
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not limit changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(100000);
      });
    });

    context('when the action is limit changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, largeLimitChanged(100))).to.equal(100);
      });
    });
  });
});
