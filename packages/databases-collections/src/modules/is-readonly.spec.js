import { expect } from 'chai';
import reducer from './is-readonly';

describe('is readonly module', function () {
  describe('#reducer', function () {
    context('when the HADRON_READONLY env is false', function () {
      before(function () {
        process.env.HADRON_READONLY = 'false';
      });

      it('returns the default state', function () {
        expect(reducer(undefined)).to.equal(false);
      });
    });
  });
});
