import reducer, {
  INITIAL_STATE,
  hideCreateDatabase,
  showCreateDatabase,
  SHOW_CREATE_DATABASE,
  HIDE_CREATE_DATABASE
} from 'modules/create-database/is-visible';

describe('create database is visible module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is show create database', () => {
        it('returns true', () => {
          expect(reducer(undefined, showCreateDatabase())).to.equal(true);
        });
      });

      context('when the action is hide create database', () => {
        it('returns false', () => {
          expect(reducer(undefined, hideCreateDatabase())).to.equal(false);
        });
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

  describe('#hideCreateDatabase', () => {
    it('returns the action', () => {
      expect(hideCreateDatabase()).to.deep.equal({
        type: HIDE_CREATE_DATABASE
      });
    });
  });
});
