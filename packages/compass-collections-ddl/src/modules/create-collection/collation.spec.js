import reducer, {
  INITIAL_STATE,
  changeCollationOption,
  CHANGE_COLLATION_OPTION
} from 'modules/create-collection/collation';

describe('create collection collation module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeCollationOption('locale', 'ar'))).
          to.deep.equal({ locale: 'ar' });
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeCollationOption', () => {
    it('returns the action', () => {
      expect(changeCollationOption('locale', 'ar')).to.deep.equal({
        type: CHANGE_COLLATION_OPTION,
        field: 'locale',
        value: 'ar'
      });
    });
  });
});
