import { expect } from 'chai';
import hasFLE2Support from './has-fle2-support';

describe('hasFLE2Support', function () {
  it('returns false for < 6.0', function () {
    expect(hasFLE2Support('4.2.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('4.4.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('5.0.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('5.2.0', 'RS', ['local'])).to.be.false;
  });

  it('returns true for 6.0+', function () {
    expect(hasFLE2Support('6.0.0-alpha0', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support('6.0.0', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support('6.1.0', 'RS', ['local'])).to.be.true;
  });

  it('returns false for standalone servers', function () {
    expect(hasFLE2Support('6.0.0-alpha0', 'Single', ['local'])).to.be.false;
    expect(hasFLE2Support('6.0.0', 'Single', ['local'])).to.be.false;
    expect(hasFLE2Support('6.1.0', 'Single', ['local'])).to.be.false;
  });

  it('returns false when no KMS is configured', function () {
    expect(hasFLE2Support('6.0.0-alpha0', 'RS', [])).to.be.false;
    expect(hasFLE2Support('6.0.0', 'RS', [])).to.be.false;
    expect(hasFLE2Support('6.1.0', 'RS', [])).to.be.false;
  });

  it('returns true for invalid versions', function () {
    expect(hasFLE2Support('', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support('notasemver', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support(undefined, 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support(null, 'RS', ['local'])).to.be.true;
  });
});
