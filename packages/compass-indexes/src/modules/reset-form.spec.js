import { resetForm, RESET_FORM } from './reset-form';

describe('reset module', () => {
  describe('#resetForm', () => {
    it('returns the resetForm action', () => {
      expect(resetForm()).to.deep.equal({ type: RESET_FORM });
    });
  });
});
