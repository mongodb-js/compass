import reducer, {
  INITIAL_STATE,
  toggleIsUnique,
  TOGGLE_IS_UNIQUE
} from 'modules/create-index/is-unique';

describe('create index is unique module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsUnique(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsUnique', () => {
    it('returns the action', () => {
      expect(toggleIsUnique(false)).to.deep.equal({
        type: TOGGLE_IS_UNIQUE,
        isUnique: false
      });
    });
  });
});
