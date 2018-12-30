import reducer, {
  INITIAL_STATE,
  changeDatabaseName,
  CHANGE_DATABASE_NAME
} from 'modules/create-database/name';

describe('create database name module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeDatabaseName('testing'))).to.equal('testing');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeDatabaseName', () => {
    it('returns the action', () => {
      expect(changeDatabaseName('test')).to.deep.equal({
        type: CHANGE_DATABASE_NAME,
        name: 'test'
      });
    });
  });
});
