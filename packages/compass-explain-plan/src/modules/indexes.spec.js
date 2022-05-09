import { expect } from 'chai';

import reducer, { indexesChanged, INDEXES_CHANGED } from './indexes';

describe('indexes module', function () {
  describe('#indexesChanged', function () {
    it('returns the INDEXES_CHANGED action', function () {
      expect(indexesChanged([])).to.deep.equal({
        type: INDEXES_CHANGED,
        indexes: [],
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not indexes changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });

    context('when the action is indexes changed', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, indexesChanged([]))).to.deep.equal([]);
      });
    });
  });
});
