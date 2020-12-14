import reducer, {
  maxTimeMSChanged,
  MAX_TIME_MS_CHANGED
} from 'modules/max-time-ms';

describe('max-time-ms module', () => {
  describe('#maxTimeMSChanged', () => {
    it('returns the MAX_TIME_MS_CHANGED action', () => {
      expect(maxTimeMSChanged(100)).to.deep.equal({
        type: MAX_TIME_MS_CHANGED,
        maxTimeMS: 100
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not limit changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(60000);
      });
    });

    context('when the action is maxTimeMSChanged changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, maxTimeMSChanged(100))).to.equal(100);
      });
    });
  });
});
