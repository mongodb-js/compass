import { expect } from 'chai';
import { reset, RESET } from './reset';

describe('reset module', () => {
  describe('#reset', () => {
    it('returns the reset action', () => {
      expect(reset()).to.deep.equal({ type: RESET });
    });
  });
});
