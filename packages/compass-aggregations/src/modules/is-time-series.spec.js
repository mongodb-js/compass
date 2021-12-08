import reducer, { isTimeSeriesChanged, IS_TIME_SERIES_CHANGED } from './is-time-series';

describe('isTimeSeries module', () => {
  describe('#isTimeSeriesChanged', () => {
    it('returns the IS_TIME_SERIES_CHANGED action', () => {
      expect(isTimeSeriesChanged(true)).to.deep.equal({
        type: IS_TIME_SERIES_CHANGED,
        isTimeSeries: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not time-series changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is time-series changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, isTimeSeriesChanged(true))).to.equal(true);
      });
    });
  });
});
