import reducer, {
  INITIAL_STATE,
  changeTtl,
  CHANGE_TTL
} from 'modules/create-index/ttl';

describe('create index partial filter expression module', () => {
  describe('#reducer', () => {
    context('when an action is provided', () => {
      it('returns the new state', () => {
        expect(
          reducer(undefined, changeTtl(1000))
        ).to.deep.equal(1000);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });

  describe('#changeTtl', () => {
    it('returns the action', () => {
      expect(changeTtl(1000)).to.deep.equal({
        type: CHANGE_TTL,
        ttl: 1000
      });
    });
  });
});
