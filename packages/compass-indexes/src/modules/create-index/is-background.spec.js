import reducer, {
  INITIAL_STATE,
  toggleIsBackground,
  TOGGLE_IS_BACKGROUND
} from 'modules/create-index/is-background';

describe('create index is background module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsBackground(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsBackground', () => {
    it('returns the action', () => {
      expect(toggleIsBackground(false)).to.deep.equal({
        type: TOGGLE_IS_BACKGROUND,
        isBackground: false
      });
    });
  });
});
