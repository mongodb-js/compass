import reducer, {
  INITIAL_STATE,
  TOGGLE_IS_DATA_LAKE,
  toggleIsDataLake
} from 'modules/is-data-lake';

describe('is-data-lake module', () => {
  describe('reducer', () => {
    context('when the action is toggleIsDataLake', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsDataLake(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsDataLake', () => {
    context('when it is a data lake', () => {
      it('sets true in the action', () => {
        expect(toggleIsDataLake(true)).to.deep.equal({
          type: TOGGLE_IS_DATA_LAKE,
          isDataLake: true
        });
      });
    });

    context('when it is not a data lake', () => {
      it('sets false in the action', () => {
        expect(toggleIsDataLake(false)).to.deep.equal({
          type: TOGGLE_IS_DATA_LAKE,
          isDataLake: false
        });
      });
    });
  });
});
