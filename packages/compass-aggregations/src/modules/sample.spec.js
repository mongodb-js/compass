import reducer, { toggleSample, TOGGLE_SAMPLE } from './sample';
import { expect } from 'chai';

describe('sample module', function() {
  describe('#toggleSample', function() {
    it('returns the TOGGLE_SAMPLE action', function() {
      expect(toggleSample()).to.deep.equal({
        type: TOGGLE_SAMPLE
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not toggle sample', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is toggle sample', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleSample())).to.equal(false);
      });
    });
  });
});
