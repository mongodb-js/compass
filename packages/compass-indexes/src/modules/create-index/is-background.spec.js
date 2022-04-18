import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsBackground,
  TOGGLE_IS_BACKGROUND,
} from '../create-index/is-background';

describe('create index is background module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsBackground(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsBackground', function () {
    it('returns the action', function () {
      expect(toggleIsBackground(false)).to.deep.equal({
        type: TOGGLE_IS_BACKGROUND,
        isBackground: false,
      });
    });
  });
});
