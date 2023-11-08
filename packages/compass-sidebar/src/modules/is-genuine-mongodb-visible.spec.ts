import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsGenuineMongoDBVisible,
  TOGGLE_IS_GENUINE_MONGODB_VISIBLE,
} from './is-genuine-mongodb-visible';

describe('is genuine mongodb visible module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, toggleIsGenuineMongoDBVisible(true))
        ).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {} as any)).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsGenuineMongoDBVisible', function () {
    it('returns the action', function () {
      expect(toggleIsGenuineMongoDBVisible(false)).to.deep.equal({
        type: TOGGLE_IS_GENUINE_MONGODB_VISIBLE,
        isVisible: false,
      });
    });
  });
});
