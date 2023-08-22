import { expect } from 'chai';
import { getDistinctValues } from '.';

describe('#getDistinctValues', function () {
  context('when the field is undefined', function () {
    it('returns an empty array', function () {
      expect(getDistinctValues()).to.deep.equal([]);
    });
  });

  context('when the field is an $in clause', function () {
    it('returns the $in clause', function () {
      expect(getDistinctValues({ $in: [1, 2, 3] })).to.deep.equal([1, 2, 3]);
    });
  });

  context('when the field is not an object', function () {
    it('returns the field in an array', function () {
      expect(getDistinctValues('test' as any)).to.deep.equal(['test']);
    });
  });
});
