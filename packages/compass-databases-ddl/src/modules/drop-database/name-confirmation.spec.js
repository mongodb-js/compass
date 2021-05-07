import reducer, {
  INITIAL_STATE,
  changeDatabaseNameConfirmation,
  CHANGE_DATABASE_NAME_CONFIRMATION
} from 'modules/drop-database/name-confirmation';

describe('drop database name confirmation module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeDatabaseNameConfirmation('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeDatabaseNameConfirmation', () => {
    it('returns the action', () => {
      expect(changeDatabaseNameConfirmation('test')).to.deep.equal({
        type: CHANGE_DATABASE_NAME_CONFIRMATION,
        nameConfirmation: 'test'
      });
    });
  });
});
