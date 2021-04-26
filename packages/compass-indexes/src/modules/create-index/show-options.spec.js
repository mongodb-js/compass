import reducer, {
  INITIAL_STATE,
  toggleShowOptions,
  TOGGLE_SHOW_OPTIONS
} from 'modules/create-index/show-options';

describe('create index is options module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleShowOptions(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleShowOptions', () => {
    it('returns the action', () => {
      expect(toggleShowOptions(false)).to.deep.equal({
        type: TOGGLE_SHOW_OPTIONS,
        showOptions: false
      });
    });
  });
});
