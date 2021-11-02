import { objectContainsRegularExpression } from '../../src/modules/utils';

describe('objectContainsRegularExpression', () => {
  it('tells whether an object contains a regular expression', function() {
    expect(objectContainsRegularExpression(null)).to.equal(false);
    expect(objectContainsRegularExpression(undefined)).to.equal(false);
    expect(objectContainsRegularExpression(1)).to.equal(false);
    expect(objectContainsRegularExpression('str')).to.equal(false);
    expect(objectContainsRegularExpression({})).to.equal(false);
    expect(objectContainsRegularExpression({ x: 1 })).to.equal(false);
    expect(objectContainsRegularExpression({ x: /re/ })).to.equal(true);
  });
});
