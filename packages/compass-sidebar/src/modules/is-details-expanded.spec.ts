import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsDetailsExpanded,
  TOGGLE_IS_DETAILS_EXPANDED,
} from './is-details-expanded';

describe('sidebar isDetailsExpanded', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsDetailsExpanded(true))).to.equal(
          true
        );
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {} as any)).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsExpanded', function () {
    it('returns the action', function () {
      expect(toggleIsDetailsExpanded(false)).to.deep.equal({
        type: TOGGLE_IS_DETAILS_EXPANDED,
        isExpanded: false,
      });
    });
  });
});
