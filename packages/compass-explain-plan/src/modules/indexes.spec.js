import reducer, { indexesChanged, INDEXES_CHANGED } from 'modules/indexes';

describe('indexes module', () => {
  describe('#indexesChanged', () => {
    it('returns the INDEXES_CHANGED action', () => {
      expect(indexesChanged([])).to.deep.equal({
        type: INDEXES_CHANGED,
        indexes: []
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not indexes changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });

    context('when the action is indexes changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, indexesChanged([]))).to.deep.equal([]);
      });
    });
  });
});
