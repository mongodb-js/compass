import { expect } from 'chai';
import reducer from './is-data-lake';

describe('is data lake module', function () {
  describe('#reducer', function () {
    context('when the action is not isDataLake changed', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })).to.equal(false);
      });
    });
  });
});
