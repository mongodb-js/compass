import reducer, {
  INITIAL_STATE,
  toggleIsGenuineMongoDB,
  TOGGLE_IS_GENUINE_MONGODB
} from 'modules/is-genuine-mongodb';

describe('is genuine mongodb module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsGenuineMongoDB(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsGenuineMongoDB', () => {
    it('returns the action', () => {
      expect(toggleIsGenuineMongoDB(false)).to.deep.equal({
        type: TOGGLE_IS_GENUINE_MONGODB,
        isGenuineMongoDB: false
      });
    });
  });
});
