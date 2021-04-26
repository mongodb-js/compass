import reducer, {
  INITIAL_STATE,
  toggleIsWritable,
  TOGGLE_IS_WRITABLE
} from 'modules/is-writable';

describe('sidebar isWritable', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsWritable(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsWritable', () => {
    it('returns the action', () => {
      expect(toggleIsWritable(false)).to.deep.equal({
        type: TOGGLE_IS_WRITABLE,
        isWritable: false
      });
    });
  });
});
