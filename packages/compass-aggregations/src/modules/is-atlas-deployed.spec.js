import reducer, { setIsAtlasDeployed, SET_IS_ATLAS_DEPLOYED } from './is-atlas-deployed';
import { expect } from 'chai';

describe('isAtlasDeployed module', function() {
  describe('#setIsAtlasDeployed', function() {
    it('returns the SET_IS_ATLAS_DEPLOYED action', function() {
      expect(setIsAtlasDeployed(true)).to.deep.equal({
        type: SET_IS_ATLAS_DEPLOYED,
        isAtlasDeployed: true
      });
    });
  });

  describe('#reducer', function() {
    context('when the action is not set is atlas deployed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });

    context('when the action is set is atlas deployed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, setIsAtlasDeployed(true))).to.equal(true);
      });
    });
  });
});
