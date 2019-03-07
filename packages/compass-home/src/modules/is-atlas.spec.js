import reducer, {
  INITIAL_STATE,
  toggleIsAtlas,
  TOGGLE_IS_ATLAS
} from 'modules/is-atlas';

describe('is-atlas module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsAtlas(false))).to.equal(false);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsAtlas', () => {
    it('returns the action', () => {
      expect(toggleIsAtlas(true)).to.deep.equal({
        type: TOGGLE_IS_ATLAS,
        isAtlas: true
      });
    });
  });
});
