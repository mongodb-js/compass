import reducer from './limit';
import { expect } from 'chai';

describe('limit module', function () {
  describe('#reducer', function () {
    context('when the action is not limit changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' } as any)).to.equal(10);
      });
    });
  });
});
