import { expect } from 'chai';
import reducer, {
  INITIAL_STATE,
  changeDatabaseNameConfirmation,
  CHANGE_DATABASE_NAME_CONFIRMATION
} from '../drop-database/name-confirmation';

describe('drop database name confirmation module', function() {
  describe('#reducer', function() {
    context('when an action is provided', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, changeDatabaseNameConfirmation('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeDatabaseNameConfirmation', function() {
    it('returns the action', function() {
      expect(changeDatabaseNameConfirmation('test')).to.deep.equal({
        type: CHANGE_DATABASE_NAME_CONFIRMATION,
        nameConfirmation: 'test'
      });
    });
  });
});
