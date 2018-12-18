import reducer, { toggleStatus, TOGGLE_STATUS } from 'modules/status';

describe('status module', () => {
  describe('#reducer', () => {
    context('when the action type is unknown', () => {
      it('returns the state', () => {
        expect(reducer('disabled', {})).to.equal('disabled');
      });
    });

    context('when the action type is TOGGLE_STATUS', () => {
      it('returns the toggled state', () => {
        expect(reducer('disabled', toggleStatus())).to.equal('enabled');
      });
    });
  });

  describe('#toggleStatus', () => {
    it('returns the action', () => {
      expect(toggleStatus()).to.deep.equal({
        type: TOGGLE_STATUS
      });
    });
  });
});
