import reducer, { toggleAutoPreview, TOGGLE_AUTO_PREVIEW } from './auto-preview';
import { expect } from 'chai';

describe('auto preview module', function() {
  describe('#toggleAutoPreview', function() {
    it('returns the TOGGLE_AUTO_PREVIEW action', function() {
      expect(toggleAutoPreview()).to.deep.equal({
        type: TOGGLE_AUTO_PREVIEW
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not toggle auto preview', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is toggle auto preview', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, toggleAutoPreview())).to.equal(false);
      });
    });
  });
});
