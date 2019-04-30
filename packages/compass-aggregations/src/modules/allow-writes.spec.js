import reducer, { allowWrites, ALLOW_WRITES } from 'modules/allow-writes';

describe('allowWrites module', () => {
  describe('#allowWrites', () => {
    it('returns the ALLOW_WRITES action', () => {
      expect(allowWrites(true)).to.deep.equal({
        type: ALLOW_WRITES,
        allowWrites: true
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not allow writes', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(true);
      });
    });

    context('when the action is set allow writes', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, allowWrites(false))).to.equal(false);
      });
    });
  });
});
