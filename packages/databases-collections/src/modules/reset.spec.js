import { expect } from 'chai';
import { reset, RESET } from './reset';

describe('reset module', function () {
  describe('#reset', function () {
    it('returns the reset action', function () {
      expect(reset()).to.deep.equal({ type: RESET });
    });
  });
});
