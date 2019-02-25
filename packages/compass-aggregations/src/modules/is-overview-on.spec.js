import reducer, { toggleOverview, TOGGLE_OVERVIEW } from 'modules/is-overview-on';

describe('overview module', () => {
  describe('#toggleOverview', () => {
    it('returns the TOGGLE_OVERVIEW action', () => {
      expect(toggleOverview()).to.deep.equal({
        type: TOGGLE_OVERVIEW
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not toggle overview', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });
  });
});
