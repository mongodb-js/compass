import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleUseCustomCollation,
  TOGGLE_USE_CUSTOM_COLLATION,
} from '../create-index/use-custom-collation';

describe('create index use custom collation module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleUseCustomCollation(true))).to.equal(
          true
        );
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleUseCustomCollation', function () {
    it('returns the action', function () {
      expect(toggleUseCustomCollation(false)).to.deep.equal({
        type: TOGGLE_USE_CUSTOM_COLLATION,
        useCustomCollation: false,
      });
    });
  });
});
