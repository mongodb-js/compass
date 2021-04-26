import reducer, {
  INITIAL_STATE,
  toggleIsTtl,
  TOGGLE_IS_TTL
} from 'modules/create-index/is-ttl';

describe('create index is ttl module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, toggleIsTtl(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#toggleIsTtl', () => {
    it('returns the action', () => {
      expect(toggleIsTtl(false)).to.deep.equal({
        type: TOGGLE_IS_TTL,
        isTtl: false
      });
    });
  });
});
