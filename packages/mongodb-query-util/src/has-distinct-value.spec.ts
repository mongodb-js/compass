import { expect } from 'chai';
import { hasDistinctValue } from './';

describe('#hasDistinctValue', function () {
  context('when the field is undefined', function () {
    it('returns false', function () {
      expect(hasDistinctValue(undefined)).to.equal(false);
    });
  });

  context('when the field is an $in clause', function () {
    const clause = { $in: [1, 2, 3] };

    context('when the value is present', function () {
      it('returns true', function () {
        expect(hasDistinctValue(clause, 1)).to.equal(true);
      });
    });

    context('when the value is not present', function () {
      it('returns false', function () {
        expect(hasDistinctValue(clause, 4)).to.equal(false);
      });
    });
  });

  context('when the field has no $in clause', function () {
    it('returns the isequal comparison', function () {
      expect(hasDistinctValue('test' as any, 'test')).to.equal(true);
    });
  });
});
