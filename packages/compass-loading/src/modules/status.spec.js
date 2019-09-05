import reducer, { changeStatus, CHANGE_STATUS } from 'modules/status';

describe('status module', () => {
  describe('#reducer', () => {
    context('when the action type is unknown', () => {
      it('returns the state', () => {
        expect(reducer(undefined, {})).to.equal('Initializing');
      });
    });

    context('when the action type is CHANGE_STATUS', () => {
      it('returns the changed state', () => {
        expect(reducer(undefined, changeStatus('Migrating'))).to.equal('Migrating');
      });
    });
  });

  describe('#changeStatus', () => {
    it('returns the action', () => {
      expect(changeStatus('Migrating')).to.deep.equal({
        type: CHANGE_STATUS,
        status: 'Migrating'
      });
    });
  });
});
