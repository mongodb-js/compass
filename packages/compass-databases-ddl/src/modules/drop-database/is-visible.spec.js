import reducer, {
  INITIAL_STATE,
  hideDropDatabase,
  showDropDatabase,
  SHOW_DROP_DATABASE,
  HIDE_DROP_DATABASE
} from 'modules/drop-database/is-visible';

describe('drop database is visible module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      context('when the action is show drop database', () => {
        it('returns true', () => {
          expect(reducer(undefined, showDropDatabase())).to.equal(true);
        });
      });

      context('when the action is hide drop database', () => {
        it('returns false', () => {
          expect(reducer(undefined, hideDropDatabase())).to.equal(false);
        });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#showDropDatabase', () => {
    it('returns the action', () => {
      expect(showDropDatabase()).to.deep.equal({
        type: SHOW_DROP_DATABASE
      });
    });
  });

  describe('#hideDropDatabase', () => {
    it('returns the action', () => {
      expect(hideDropDatabase()).to.deep.equal({
        type: HIDE_DROP_DATABASE
      });
    });
  });
});
