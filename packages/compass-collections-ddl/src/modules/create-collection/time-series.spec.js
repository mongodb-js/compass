import reducer, {
  INITIAL_STATE,
  changeTimeSeriesOption,
  CHANGE_TIME_SERIES_OPTION
} from '../create-collection/time-series';

describe('create collection time-series module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeTimeSeriesOption('locale', 'ar'))).
          to.deep.equal({ locale: 'ar' });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeTimeSeriesOption', () => {
    it('returns the action', () => {
      expect(changeTimeSeriesOption('locale', 'ar')).to.deep.equal({
        type: CHANGE_TIME_SERIES_OPTION,
        field: 'locale',
        value: 'ar'
      });
    });
  });
});
