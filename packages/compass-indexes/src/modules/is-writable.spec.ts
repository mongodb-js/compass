import { expect } from 'chai';

import reducer, { INITIAL_STATE, writeStateChanged } from './is-writable';

describe('is writable module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, writeStateChanged(false))).to.equal(false);
      });
    });

    context('when an unknown action is provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'something unknown' })).to.equal(
          INITIAL_STATE
        );
      });
    });
  });
});
