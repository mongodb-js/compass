import reducer, {
  INITIAL_STATE,
  toggleIsCustomCollation,
  TOGGLE_IS_CUSTOM_COLLATION
} from 'modules/create-database/is-custom-collation';

describe('create database is custom collation module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsCustomCollation(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsCustomCollation', () => {
    it('returns the action', () => {
      expect(toggleIsCustomCollation(false)).to.deep.equal({
        type: TOGGLE_IS_CUSTOM_COLLATION,
        isCustomCollation: false
      });
    });
  });
});
