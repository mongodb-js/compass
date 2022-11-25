import { expect } from 'chai';
import hasTimeSeriesSupport from './has-time-series-support';

describe('hasTimeSeriesSupport', function () {
  it('returns false for < 5.0', function () {
    expect(hasTimeSeriesSupport('4.4.0')).to.be.false;
  });

  it('returns true for 5.0', function () {
    expect(hasTimeSeriesSupport('5.0.0')).to.be.true;
  });

  it('returns true for >= 5.0', function () {
    expect(hasTimeSeriesSupport('5.0.0')).to.be.true;
    expect(hasTimeSeriesSupport('5.0.0-alpha0-277-g02d6940')).to.be.true;
  });

  it('returns true for invalid versions', function () {
    expect(hasTimeSeriesSupport('')).to.be.true;
    expect(hasTimeSeriesSupport('notasemver')).to.be.true;
    expect(hasTimeSeriesSupport(undefined)).to.be.true;
    expect(hasTimeSeriesSupport(null)).to.be.true;
  });
});
