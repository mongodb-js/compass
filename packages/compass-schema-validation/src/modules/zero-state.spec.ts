import { expect } from 'chai';

import reducer, { zeroStateChanged, IS_ZERO_STATE_CHANGED } from './zero-state';

describe('zero-state module', function () {
  describe('#zeroStateChanged', function () {
    it('returns the IS_ZERO_STATE_CHANGED action', function () {
      expect(zeroStateChanged(false)).to.deep.equal({
        type: IS_ZERO_STATE_CHANGED,
        isZeroState: false,
      });
    });
  });

  describe('#reducer', function () {
    context(
      'when the action is not presented in zero-state module',
      function () {
        it('returns the default state', function () {
          expect(reducer(undefined, { type: 'test' } as any)).to.equal(true);
        });
      }
    );

    context('when the action is zeroStateChanged', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, zeroStateChanged(true))).to.equal(true);
      });
    });
  });
});
