import { expect } from 'chai';
import reducer from './limit';

describe('limit module', function () {
  describe('#reducer', function () {
    context('when the action is not limit changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal(10);
      });
    });
  });
});
