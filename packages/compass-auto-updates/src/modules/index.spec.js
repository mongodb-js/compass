import reducer, { updateAvailable, UPDATE_AVAILABLE, INITIAL_STATE } from 'modules';

describe('index module', () => {
  describe('#updateAvailable', () => {
    it('returns the UPDATE_AVAILABLE action', () => {
      expect(updateAvailable('1.9.0')).to.deep.equal({
        type: UPDATE_AVAILABLE,
        version: '1.9.0'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not recognised', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal(INITIAL_STATE);
      });
    });

    context('when the action is update available', () => {
      it('returns the new visible state', () => {
        expect(reducer(undefined, updateAvailable('1.4.0'))).to.deep.equal({
          isVisible: true,
          version: '1.4.0'
        });
      });
    });
  });
});
