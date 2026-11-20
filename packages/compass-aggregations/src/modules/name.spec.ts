import { expect } from 'chai';
import reducer from './name';

describe('name module', function () {
  describe('#reducer', function () {
    context('when the action is not name changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' } as any)).to.equal('');
      });
    });
  });
});
