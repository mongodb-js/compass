import reducer, { sampleToggled, SAMPLE_TOGGLED } from 'modules/sample';

describe('sample module', () => {
  describe('#sampleToggled', () => {
    it('returns the SAMPLE_TOGGLED action', () => {
      expect(sampleToggled()).to.deep.equal({
        type: SAMPLE_TOGGLED
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not sample toggled', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal({
          isEnabled: true,
          value: 1000
        });
      });
    });

    context('when the action is sample changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, sampleToggled())).to.deep.equal({
          isEnabled: false,
          value: 1000
        });
      });
    });
  });
});
