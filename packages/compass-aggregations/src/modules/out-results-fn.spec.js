import reducer, { outResultsFnChanged, OUT_RESULTS_FN_CHANGED } from './out-results-fn';
import { expect } from 'chai';

describe('outResultsFn module', function() {
  describe('#outResultsFnChanged', function() {
    it('returns the OUT_RESULTS_FN_CHANGED action', function() {
      expect(outResultsFnChanged('testing')).to.deep.equal({
        type: OUT_RESULTS_FN_CHANGED,
        outResultsFn: 'testing'
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not outResultsFn changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is outResultsFn changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, outResultsFnChanged('testing'))).to.equal('testing');
      });
    });
  });
});
