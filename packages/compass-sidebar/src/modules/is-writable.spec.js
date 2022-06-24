import { expect } from 'chai';

import reducer, {
  INITIAL_STATE,
  toggleIsWritable,
  TOGGLE_IS_WRITABLE
} from './is-writable';

describe('sidebar isWritable', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, toggleIsWritable(true))).to.equal(true);
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsWritable', function () {
    it('returns the action', function () {
      expect(toggleIsWritable(false)).to.deep.equal({
        type: TOGGLE_IS_WRITABLE,
        isWritable: false
      });
    });
  });
});
