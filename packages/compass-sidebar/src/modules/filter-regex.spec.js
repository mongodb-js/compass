import reducer, {
  INITIAL_STATE,
  changeFilterRegex,
  CHANGE_FILTER_REGEX
} from 'modules/filter-regex';

describe('sidebar filter regex', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, changeFilterRegex('new filter regex'))).to.equal('new filter regex');
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeFilterRegex', () => {
    it('returns the action', () => {
      expect(changeFilterRegex('new filter regex w action')).to.deep.equal({
        type: CHANGE_FILTER_REGEX,
        filterRegex: 'new filter regex w action'
      });
    });
  });
});
