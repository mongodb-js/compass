import reducer, { toggleOverview, TOGGLE_OVERVIEW } from './is-overview-on';
import { expect } from 'chai';

describe('overview module', function() {
  describe('#toggleOverview', function() {
    it('returns the TOGGLE_OVERVIEW action', function() {
      expect(toggleOverview()).to.deep.equal({
        type: TOGGLE_OVERVIEW
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not toggle overview', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });
  });
});
