import { expect } from 'chai';

import {
  hasEditableTimeSeriesSupport,
  MIN_EDITABLE_TIME_SERIES_SERVER_VERSION,
} from './editable-time-series';

describe('hasEditableTimeSeriesSupport', function () {
  it(`returns false for < ${MIN_EDITABLE_TIME_SERIES_SERVER_VERSION}`, function () {
    expect(hasEditableTimeSeriesSupport('4.2.0')).to.be.false;
    expect(hasEditableTimeSeriesSupport('4.4.0')).to.be.false;
    expect(hasEditableTimeSeriesSupport('5.0.0')).to.be.false;
    expect(hasEditableTimeSeriesSupport('6.0.1')).to.be.false;
  });

  it(`returns true for ${MIN_EDITABLE_TIME_SERIES_SERVER_VERSION}`, function () {
    expect(hasEditableTimeSeriesSupport('7.0.0')).to.be.true;
    expect(hasEditableTimeSeriesSupport('7.2.0')).to.be.true;
  });

  it('returns true for invalid versions', function () {
    expect(hasEditableTimeSeriesSupport('')).to.be.true;
    expect(hasEditableTimeSeriesSupport('notasemver')).to.be.true;
    expect(hasEditableTimeSeriesSupport(undefined)).to.be.true;
    expect(hasEditableTimeSeriesSupport(null)).to.be.true;
  });
});
