import reducer, {
  maxTimeMSChanged,
  MAX_TIME_MS_CHANGED
} from './max-time-ms';
import { expect } from 'chai';

describe('max-time-ms module', function() {
  describe('#maxTimeMSChanged', function() {
    it('returns the MAX_TIME_MS_CHANGED action', function() {
      expect(maxTimeMSChanged(100)).to.deep.equal({
        type: MAX_TIME_MS_CHANGED,
        maxTimeMS: 100
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not limit changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is maxTimeMSChanged changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, maxTimeMSChanged(100))).to.equal(100);
      });
    });
  });
});
