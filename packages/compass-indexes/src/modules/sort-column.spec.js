import { expect } from 'chai';

import reducer, { INITIAL_STATE } from './sort-column';
import { sortIndexes } from './indexes';

describe('sort column module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      it('returns the new column', function () {
        expect(reducer(undefined, sortIndexes(null, 'Size', ''))).to.equal(
          'Size'
        );
      });
    });

    context('when an action is not provided', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
