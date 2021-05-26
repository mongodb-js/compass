import reducer, { INITIAL_STATE } from './is-readonly';

describe('is readonly module', () => {
  describe('#reducer', () => {
    it('returns the default state', () => {
      expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
    });
  });
});
