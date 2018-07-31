import reducer, {
  updateAvailable,
  cancelUpdate,
  UPDATE_AVAILABLE,
  CANCEL_UPDATE,
  INITIAL_STATE
} from 'modules';

describe('index module', () => {
  describe('#updateAvailable', () => {
    it('returns the UPDATE_AVAILABLE action', () => {
      expect(updateAvailable('1.9.0')).to.deep.equal({
        type: UPDATE_AVAILABLE,
        version: '1.9.0'
      });
    });
  });

  describe('#cancelUpdate', () => {
    it('returns the CANCEL_UPDATE action', () => {
      expect(cancelUpdate()).to.deep.equal({
        type: CANCEL_UPDATE
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

    context('when the action is cancel update', () => {
      it('returns the new non visible state', () => {
        expect(reducer(undefined, cancelUpdate())).to.deep.equal({
          isVisible: false,
          version: ''
        });
      });
    });
  });
});
