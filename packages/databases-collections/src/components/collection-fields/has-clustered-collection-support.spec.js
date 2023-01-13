import { expect } from 'chai';
import hasClusteredCollectionSupport from './has-clustered-collection-support';

describe('hasClusteredCollectionSupport', function () {
  let initialEnvVars;

  before(function () {
    initialEnvVars = Object.assign({}, process.env);
  });

  after(function () {
    process.env = initialEnvVars;
  });

  it('returns false for < 5.3', function () {
    expect(hasClusteredCollectionSupport('4.2.0')).to.be.false;
    expect(hasClusteredCollectionSupport('4.4.0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.0.0')).to.be.false;
    expect(hasClusteredCollectionSupport('5.2.0')).to.be.false;
  });

  it('returns true for 5.3+', function () {
    expect(hasClusteredCollectionSupport('5.3.0-alpha0')).to.be.true;
    expect(hasClusteredCollectionSupport('5.3.0')).to.be.true;
    expect(hasClusteredCollectionSupport('6.0.0')).to.be.true;
    expect(hasClusteredCollectionSupport('6.1.0')).to.be.true;
  });

  it('returns true for invalid versions', function () {
    expect(hasClusteredCollectionSupport('')).to.be.true;
    expect(hasClusteredCollectionSupport('notasemver')).to.be.true;
    expect(hasClusteredCollectionSupport(undefined)).to.be.true;
    expect(hasClusteredCollectionSupport(null)).to.be.true;
  });
});
