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

    expect(hasFLE2Support('4.2.0')).to.be.false;
    expect(hasFLE2Support('4.4.0')).to.be.false;
    expect(hasFLE2Support('5.0.0')).to.be.false;
    expect(hasFLE2Support('5.2.0')).to.be.false;
    expect(hasFLE2Support('6.0.0-alpha0')).to.be.false;
    expect(hasFLE2Support('6.0.0')).to.be.false;
    expect(hasFLE2Support('6.1.0')).to.be.false;
  });

  it('returns false for < 6.0', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('4.2.0')).to.be.false;
    expect(hasFLE2Support('4.4.0')).to.be.false;
    expect(hasFLE2Support('5.0.0')).to.be.false;
    expect(hasFLE2Support('5.2.0')).to.be.false;
  });

  it('returns true for 6.0+', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('6.0.0-alpha0')).to.be.true;
    expect(hasFLE2Support('6.0.0')).to.be.true;
    expect(hasFLE2Support('6.1.0')).to.be.true;
  });

  it('returns true for invalid versions', () => {
    process.env.COMPASS_CSFLE_SUPPORT = 'true';

    expect(hasFLE2Support('')).to.be.true;
    expect(hasFLE2Support('notasemver')).to.be.true;
    expect(hasFLE2Support(undefined)).to.be.true;
    expect(hasFLE2Support(null)).to.be.true;
  });
});
