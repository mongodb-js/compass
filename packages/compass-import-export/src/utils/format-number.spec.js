import formatNumber from './format-number';

describe('format-number', () => {
  it('should format an integer', () => {
    expect(formatNumber(2718)).to.be.equal('2,718');
  });
  it('should format a float the same way as an integer', () => {
    expect(formatNumber(0.9)).to.be.equal('1');
  });
});
