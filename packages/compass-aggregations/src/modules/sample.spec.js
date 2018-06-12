import reducer, { toggleSample, TOGGLE_SAMPLE } from 'modules/sample';

describe('sample module', () => {
  describe('#toggleSample', () => {
    it('returns the TOGGLE_SAMPLE action', () => {
      expect(toggleSample()).to.deep.equal({
        type: TOGGLE_SAMPLE
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not toggle sample', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is toggle sample', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleSample())).to.equal(false);
      });
    });
  });
});
