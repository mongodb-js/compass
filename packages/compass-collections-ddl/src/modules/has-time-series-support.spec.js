import hasTimeSeriesSupport from './has-time-series-support';

describe('hasTimeSeriesSupport', () => {
  describe('returns false for < 5.0', () => {
    expect(hasTimeSeriesSupport('5.0.0')).to.be.true;
  });

  describe('returns true for >= 5.0', () => {
    expect(hasTimeSeriesSupport('5.0.0')).to.be.true;
    expect(hasTimeSeriesSupport('5.0.0-alpha0-277-g02d6940')).to.be.true;
  });

  describe('returns true for invalid versions', () => {
    expect(hasTimeSeriesSupport('')).to.be.true;
    expect(hasTimeSeriesSupport('notasemver')).to.be.true;
    expect(hasTimeSeriesSupport(undefined)).to.be.true;
    expect(hasTimeSeriesSupport(null)).to.be.true;
  });
});
