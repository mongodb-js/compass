import reducer, { limitChanged, LIMIT_CHANGED } from 'modules/limit';

describe('limit module', () => {
  describe('#limitChanged', () => {
    it('returns the LIMIT_CHANGED action', () => {
      expect(limitChanged(100)).to.deep.equal({
        type: LIMIT_CHANGED,
        limit: 100
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not limit changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(20);
      });
    });

    context('when the action is limit changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, limitChanged(100))).to.equal(100);
      });
    });
  });
});
