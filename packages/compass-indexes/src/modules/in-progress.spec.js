import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleInProgress,
  TOGGLE_IN_PROGRESS,
} from './in-progress';

describe('drop index is running module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleInProgress(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleInProgress', function () {
    it('returns the action', function () {
      expect(toggleInProgress(false)).to.deep.equal({
        type: TOGGLE_IN_PROGRESS,
        inProgress: false,
      });
    });
  });
});
