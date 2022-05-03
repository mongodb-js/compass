import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsVisible,
  TOGGLE_IS_VISIBLE,
} from './is-visible';

describe('drop/create index is visible module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsVisible(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsVisible', function () {
    it('returns the action', function () {
      expect(toggleIsVisible(false)).to.deep.equal({
        type: TOGGLE_IS_VISIBLE,
        isVisible: false,
      });
    });
  });
});
