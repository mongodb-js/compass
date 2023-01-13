import { maxTimeMSChanged, MAX_TIME_MS_CHANGED } from './max-time-ms';
import { expect } from 'chai';

describe('root [ module ]', function() {
  describe('#maxTimeMS', function() {
    it('returns the MAX_TIME_MS_CHANGED action', function() {
      expect(maxTimeMSChanged(100)).to.deep.equal({
        type: MAX_TIME_MS_CHANGED,
        maxTimeMS: 100
      });
    });
  });
});
