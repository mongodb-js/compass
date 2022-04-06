import { expect } from 'chai';

import reducer, {
  isDataLakeChanged,
  IS_DATA_LAKE_CHANGED,
} from './is-data-lake';

describe('is data lake module', function () {
  describe('#isDataLakeChanged', function () {
    context('when the value is true', function () {
      it('returns the IS_DATA_LAKE_CHANGED action', function () {
        expect(isDataLakeChanged(true)).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: true,
        });
      });
    });

    context('when the value is null', function () {
      it('returns the IS_DATA_LAKE_CHANGED action with false', function () {
        expect(isDataLakeChanged(null)).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: false,
        });
      });
    });

    context('when the value is false', function () {
      it('returns the IS_DATA_LAKE_CHANGED action with false', function () {
        expect(isDataLakeChanged(false)).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: false,
        });
      });
    });

    context('when the value is undefined', function () {
      it('returns the IS_DATA_LAKE_CHANGED action with false', function () {
        expect(isDataLakeChanged()).to.deep.equal({
          type: IS_DATA_LAKE_CHANGED,
          isDataLake: false,
        });
      });
    });
  });

  describe('#reducer', function () {
    context('when the action is not isDataLake changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is isDataLake changed', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, isDataLakeChanged(true))).to.equal(true);
      });
    });
  });
});
