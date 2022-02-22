import reducer, {
  toggleFullscreen,
  TOGGLE_FULLSCREEN
} from './is-fullscreen-on';
import { expect } from 'chai';

describe('fullscreen module', function() {
  describe('#toggleFullscreen', function() {
    it('returns the TOGGLE_FULLSCREEN action', function() {
      expect(toggleFullscreen()).to.deep.equal({
        type: TOGGLE_FULLSCREEN
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not toggle fullscreen', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {
          type: 'test'
        })).to.equal(false);
      });
    });
    let state;

    it('should turn it on', function() {
      state = reducer(undefined, {
        type: TOGGLE_FULLSCREEN
      });
      expect(state).to.be.true;
    });

    it('should turn it off', function() {
      state = reducer(state, {
        type: TOGGLE_FULLSCREEN
      });
      expect(state).to.be.false;
    });
  });
});
