import reducer, { toggleAutoPreview, TOGGLE_AUTO_PREVIEW } from 'modules/auto-preview';

describe('auto preview module', () => {
  describe('#toggleAutoPreview', () => {
    it('returns the TOGGLE_AUTO_PREVIEW action', () => {
      expect(toggleAutoPreview()).to.deep.equal({
        type: TOGGLE_AUTO_PREVIEW
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not toggle auto preview', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is toggle auto preview', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleAutoPreview())).to.equal(false);
      });
    });
  });
});
