import reducer, {
  toggleFullscreen,
  TOGGLE_FULLSCREEN
} from 'modules/is-fullscreen-on';

describe('fullscreen module', () => {
  describe('#toggleFullscreen', () => {
    it('returns the TOGGLE_FULLSCREEN action', () => {
      expect(toggleFullscreen()).to.deep.equal({
        type: TOGGLE_FULLSCREEN
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not toggle fullscreen', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {
          type: 'test'
        })).to.equal(false);
      });
    });
    let state;

    it('should turn it on', () => {
      state = reducer(undefined, {
        type: TOGGLE_FULLSCREEN
      });
      expect(state).to.be.true;
    });

    it('should turn it off', () => {
      state = reducer(state, {
        type: TOGGLE_FULLSCREEN
      });
      expect(state).to.be.false;
    });
  });
});
