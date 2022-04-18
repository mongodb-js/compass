import { expect } from 'chai';

import reducer, { INITIAL_STATE } from './is-readonly';

describe('is readonly module', function () {
  describe('#reducer', function () {
    it('returns the default state', function () {
      expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
    });
  });
});
