import { expect } from 'chai';

import reducer, { INITIAL_STATE } from './sort-order';
import { sortIndexes } from './indexes';

describe('sort order module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new order', function() {
        expect(reducer(undefined, sortIndexes(null, '', 'desc'))).to.equal('desc');
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});
