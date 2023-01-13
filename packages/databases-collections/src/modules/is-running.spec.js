import { expect } from 'chai';
import reducer, {
  INITIAL_STATE,
  toggleIsRunning,
  TOGGLE_IS_RUNNING,
} from './is-running';

describe('drop database is running module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsRunning(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsRunning', function () {
    it('returns the action', function () {
      expect(toggleIsRunning(false)).to.deep.equal({
        type: TOGGLE_IS_RUNNING,
        isRunning: false,
      });
    });
  });
});
