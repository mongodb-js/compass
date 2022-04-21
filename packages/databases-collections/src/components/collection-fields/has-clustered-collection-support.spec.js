import { expect } from 'chai';
import hasClusteredCollectionSupport from './has-clustered-collection-support';

describe('hasClusteredCollectionSupport', () => {
  let initialEnvVars;

  before(() => {
    initialEnvVars = Object.assign({}, process.env);
  });

  after(() => {
    process.env = initialEnvVars;
  });

  it('returns false for without the feature flag', () => {
    delete process.env.COMPASS_CLUSTERED_COLLECTIONS;

    expect(hasClusteredCollectionSupport('4.2.0')).to.be.false;
    expect(hasClusteredCollectionSupport('4.4.0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.0.0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.2.0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.3.0-alpha0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.3.0')).to.be.false;
    expect(hasClusteredCollectionSupport('6.0.0')).to.be.false;
    expect(hasClusteredCollectionSupport('6.1.0')).to.be.false;
  });

  it('returns false for < 5.3', () => {
    process.env.COMPASS_CLUSTERED_COLLECTIONS = 'true';

    expect(hasClusteredCollectionSupport('4.2.0')).to.be.false;
    expect(hasClusteredCollectionSupport('4.4.0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.0.0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.2.0')).to.be.false;
  });

  it('returns true for 5.3+', () => {
    process.env.COMPASS_CLUSTERED_COLLECTIONS = 'true';

    expect(hasClusteredCollectionSupport('5.3.0-alpha0')).to.be.true;
    expect(hasClusteredCollectionSupport('5.3.0')).to.be.true;
    expect(hasClusteredCollectionSupport('6.0.0')).to.be.true;
    expect(hasClusteredCollectionSupport('6.1.0')).to.be.true;
  });

  it('returns true for invalid versions', () => {
    process.env.COMPASS_CLUSTERED_COLLECTIONS = 'true';

    expect(hasClusteredCollectionSupport('')).to.be.true;
    expect(hasClusteredCollectionSupport('notasemver')).to.be.true;
    expect(hasClusteredCollectionSupport(undefined)).to.be.true;
    expect(hasClusteredCollectionSupport(null)).to.be.true;
  });
});
