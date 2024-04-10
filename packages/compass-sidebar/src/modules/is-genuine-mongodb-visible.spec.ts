import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsGenuineMongoDBVisible,
  TOGGLE_IS_GENUINE_MONGODB_VISIBLE,
} from './is-genuine-mongodb-visible';

const CONNECTION_ID = 'webscale';

describe('is genuine mongodb visible module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, toggleIsGenuineMongoDBVisible(CONNECTION_ID, true))
        ).to.deep.equal({ [CONNECTION_ID]: true });
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {} as any)).to.deep.equal({});
      });
    });
  });

  describe('#toggleIsGenuineMongoDBVisible', function () {
    it('returns the action', function () {
      expect(toggleIsGenuineMongoDBVisible(CONNECTION_ID, false)).to.deep.equal(
        {
          type: TOGGLE_IS_GENUINE_MONGODB_VISIBLE,
          connectionId: CONNECTION_ID,
          isVisible: false,
        }
      );
    });
  });
});
