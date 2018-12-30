import reducer, {
  INITIAL_STATE,
  showCreateDatabase,
  SHOW_CREATE_DATABASE
} from 'modules/create-database/is-visible';

describe('create database is visible module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, showCreateDatabase())).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#showCreateDatabase', () => {
    it('returns the action', () => {
      expect(showCreateDatabase()).to.deep.equal({
        type: SHOW_CREATE_DATABASE
      });
    });
  });
});
