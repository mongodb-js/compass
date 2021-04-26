import reducer, { setIsAtlasDeployed, SET_IS_ATLAS_DEPLOYED } from 'modules/is-atlas-deployed';

describe('isAtlasDeployed module', () => {
  describe('#setIsAtlasDeployed', () => {
    it('returns the SET_IS_ATLAS_DEPLOYED action', () => {
      expect(setIsAtlasDeployed(true)).to.deep.equal({
        type: SET_IS_ATLAS_DEPLOYED,
        isAtlasDeployed: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not set is atlas deployed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is set is atlas deployed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, setIsAtlasDeployed(true))).to.equal(true);
      });
    });
  });
});
