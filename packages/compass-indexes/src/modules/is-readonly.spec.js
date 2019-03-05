import reducer, { INITIAL_STATE } from 'modules/is-readonly';

describe('is readonly module', () => {
  describe('#reducer', () => {
    it('returns the default state', () => {
      expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
    });
  });
});
