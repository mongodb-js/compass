import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsGenuineMongoDB,
  TOGGLE_IS_GENUINE_MONGODB,
} from './is-genuine-mongodb';

describe('is genuine mongodb module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsGenuineMongoDB(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsGenuineMongoDB', function () {
    it('returns the action', function () {
      expect(toggleIsGenuineMongoDB(false)).to.deep.equal({
        type: TOGGLE_IS_GENUINE_MONGODB,
        isGenuineMongoDB: false,
      });
    });
  });
});
