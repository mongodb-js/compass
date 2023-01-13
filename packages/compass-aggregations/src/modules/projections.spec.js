import reducer from './projections';
import { expect } from 'chai';

describe('projections module', function() {
  describe('#reducer', function() {
    context('when the action is not projections changed', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal([]);
      });
    });
  });
});
