import reducer, {
  INITIAL_STATE,
  toggleIsGenuineMongoDBVisible,
  TOGGLE_IS_GENUINE_MONGODB_VISIBLE
} from 'modules/is-genuine-mongodb-visible';

describe('is genuine mongodb visible module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsGenuineMongoDBVisible(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsGenuineMongoDBVisible', () => {
    it('returns the action', () => {
      expect(toggleIsGenuineMongoDBVisible(false)).to.deep.equal({
        type: TOGGLE_IS_GENUINE_MONGODB_VISIBLE,
        isVisible: false
      });
    });
  });
});
