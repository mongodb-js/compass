import reducer, {
  INITIAL_STATE,
  toggleIsTimeSeries,
  TOGGLE_IS_TIME_SERIES
} from '../create-collection/is-time-series';

describe('create collection is capped module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsTimeSeries(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsTimeSeries', () => {
    it('returns the action', () => {
      expect(toggleIsTimeSeries(false)).to.deep.equal({
        type: TOGGLE_IS_TIME_SERIES,
        isTimeSeries: false
      });
    });
  });
});
