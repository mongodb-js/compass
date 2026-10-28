import { expect } from 'chai';
import reducer from './large-limit';

describe('large-limit module', function () {
  describe('#reducer', function () {
    context('when the action is not limit changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal(100000);
      });
    });
  });
});
