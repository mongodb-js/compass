import { expect } from 'chai';

import { objectContainsRegularExpression, hasArrayOfLength } from './';
import Document from 'hadron-document';

describe('objectContainsRegularExpression', function () {
  it('tells whether an object contains a regular expression', function () {
    expect(objectContainsRegularExpression(null)).to.equal(false);
    expect(objectContainsRegularExpression(undefined)).to.equal(false);
    expect(objectContainsRegularExpression(1)).to.equal(false);
    expect(objectContainsRegularExpression('str')).to.equal(false);
    expect(objectContainsRegularExpression({})).to.equal(false);
    expect(objectContainsRegularExpression({ x: 1 })).to.equal(false);
    expect(objectContainsRegularExpression({ x: /re/ })).to.equal(true);
  });
});

describe('hasArrayOfLength', function () {
  it('should return true when document contains array of certain length', function () {
    expect(hasArrayOfLength(new Document({ foo: [1] }), 1)).to.eq(true);
    expect(
      hasArrayOfLength(new Document({ foo: { bar: { buz: { bla: [1] } } } }), 1)
    ).to.eq(true);
  });

  it("should return false when document doesn't contain arrays of certain length", function () {
    expect(hasArrayOfLength(new Document({ foo: [1] }), 5)).to.eq(false);
    expect(
      hasArrayOfLength(new Document({ foo: { bar: { buz: { bla: [1] } } } }), 5)
    ).to.eq(false);
  });

  it('should return false when there are no arrays in the document', function () {
    expect(
      hasArrayOfLength(
        new Document({
          foo: true,
          bar: 123,
          buz: 'nope',
          test: { nested: { but: { not: { array: true } } } },
        })
      )
    ).to.eq(false);
  });
});
