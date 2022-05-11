import { expect } from 'chai';
import hasFLE2Support from './has-fle2-support';

describe('hasFLE2Support', () => {
  let initialEnvVars;

  before(() => {
    initialEnvVars = Object.assign({}, process.env);
  });

  after(() => {
    process.env = initialEnvVars;
  });

  it('returns false for without the feature flag', () => {
    delete process.env.COMPASS_CSFLE_SUPPORT;

    expect(hasFLE2Support('4.2.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('4.4.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('5.0.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('5.2.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('6.0.0-alpha0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('6.0.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('6.1.0', 'RS', ['local'])).to.be.false;
  });

  it('returns false for < 6.0', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('4.2.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('4.4.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('5.0.0', 'RS', ['local'])).to.be.false;
    expect(hasFLE2Support('5.2.0', 'RS', ['local'])).to.be.false;
  });

  it('returns true for 6.0+', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('6.0.0-alpha0', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support('6.0.0', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support('6.1.0', 'RS', ['local'])).to.be.true;
  });

  it('returns false for standalone servers', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('6.0.0-alpha0', 'Single', ['local'])).to.be.false;
    expect(hasFLE2Support('6.0.0', 'Single', ['local'])).to.be.false;
    expect(hasFLE2Support('6.1.0', 'Single', ['local'])).to.be.false;
  });


  it('returns false when no KMS is configured', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('6.0.0-alpha0', 'RS', [])).to.be.false;
    expect(hasFLE2Support('6.0.0', 'RS', [])).to.be.false;
    expect(hasFLE2Support('6.1.0', 'RS', [])).to.be.false;
  });

  it('returns true for invalid versions', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support('notasemver', 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support(undefined, 'RS', ['local'])).to.be.true;
    expect(hasFLE2Support(null, 'RS', ['local'])).to.be.true;
  });
});
