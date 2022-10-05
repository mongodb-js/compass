import reducer from './name';
import { expect } from 'chai';

describe('name module', function() {
  describe('#reducer', function() {
    context('when the action is not name changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });
  });
});
