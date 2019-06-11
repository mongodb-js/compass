import reducer, { isDataLakeChanged, IS_DATA_LAKE_CHANGED } from 'modules/is-data-lake';

describe('is data lake module', () => {
  describe('#isDataLakeChanged', () => {
    context('when the value is true', () => {
      it('returns the IS_DATA_LAKE_CHANGED action', () => {
        expect(isDataLakeChanged(true)).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: true
        });
      });
    });

    context('when the value is null', () => {
      it('returns the IS_DATA_LAKE_CHANGED action with false', () => {
        expect(isDataLakeChanged(null)).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: false
        });
      });
    });

    context('when the value is false', () => {
      it('returns the IS_DATA_LAKE_CHANGED action with false', () => {
        expect(isDataLakeChanged(false)).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: false
        });
      });
    });

    context('when the value is undefined', () => {
      it('returns the IS_DATA_LAKE_CHANGED action with false', () => {
        expect(isDataLakeChanged()).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: false
        });
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not isDataLake changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is isDataLake changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, isDataLakeChanged(true))).to.equal(true);
      });
    });
  });
});
