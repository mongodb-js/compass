import { expect } from 'chai';

import { resetForm, RESET_FORM } from './reset-form';

describe('reset module', function () {
  describe('#resetForm', function () {
    it('returns the resetForm action', function () {
      expect(resetForm()).to.deep.equal({ type: RESET_FORM });
    });
  });
});
