import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  TOGGLE_IS_DATA_LAKE,
  toggleIsDataLake
} from './is-data-lake';

describe('is-data-lake module', function () {
  describe('reducer', function () {
    context('when the action is toggleIsDataLake', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsDataLake(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsDataLake', function () {
    context('when it is a data lake', function () {
      it('sets true in the action', function () {
        expect(toggleIsDataLake(true)).to.deep.equal({
          type: TOGGLE_IS_DATA_LAKE,
          isDataLake: true
        });
      });
    });

    context('when it is not a data lake', function () {
      it('sets false in the action', function () {
        expect(toggleIsDataLake(false)).to.deep.equal({
          type: TOGGLE_IS_DATA_LAKE,
          isDataLake: false
        });
      });
    });
  });
});
