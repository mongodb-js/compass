import reducer, { outResultsFnChanged, OUT_RESULTS_FN_CHANGED } from 'modules/out-results-fn';

describe('outResultsFn module', () => {
  describe('#outResultsFnChanged', () => {
    it('returns the OUT_RESULTS_FN_CHANGED action', () => {
      expect(outResultsFnChanged('testing')).to.deep.equal({
        type: OUT_RESULTS_FN_CHANGED,
        outResultsFn: 'testing'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not outResultsFn changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is outResultsFn changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, outResultsFnChanged('testing'))).to.equal('testing');
      });
    });
  });
});
