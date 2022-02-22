import reducer, { isTimeSeriesChanged, IS_TIME_SERIES_CHANGED } from './is-time-series';
import { expect } from 'chai';

describe('isTimeSeries module', function() {
  describe('#isTimeSeriesChanged', function() {
    it('returns the IS_TIME_SERIES_CHANGED action', function() {
      expect(isTimeSeriesChanged(true)).to.deep.equal({
        type: IS_TIME_SERIES_CHANGED,
        isTimeSeries: true
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not time-series changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is time-series changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, isTimeSeriesChanged(true))).to.equal(true);
      });
    });
  });
});
