import { expect } from 'chai';

import { hasColumnstoreIndexesSupport } from './has-columnstore-indexes-support';

describe('hasColumnstoreIndexesSupport', function () {
  let initialEnvVars;

  before(function () {
    initialEnvVars = Object.assign({}, process.env);
  });

  after(function () {
    process.env = initialEnvVars;
  });

  it('returns false without the feature flag', function () {
    delete process.env.COMPASS_COLUMNSTORE_INDEXES;

    expect(hasColumnstoreIndexesSupport('4.2.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('4.4.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('5.0.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('5.2.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('5.3.0-alpha0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('5.3.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('6.0.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('6.1.0')).to.be.false;
  });

  it('returns false for < 6.1.0', function () {
    process.env.COMPASS_COLUMNSTORE_INDEXES = 'true';

    expect(hasColumnstoreIndexesSupport('4.2.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('4.4.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('5.0.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('6.0.1')).to.be.false;
  });

  it('returns true for 6.1+', function () {
    process.env.COMPASS_COLUMNSTORE_INDEXES = 'true';

    expect(hasColumnstoreIndexesSupport('6.1.0-alpha0')).to.be.true;
    expect(hasColumnstoreIndexesSupport('6.1.0')).to.be.true;
    expect(hasColumnstoreIndexesSupport('7.0.0')).to.be.true;
    expect(hasColumnstoreIndexesSupport('7.2.0')).to.be.true;
  });

  it('returns true for invalid versions', function () {
    process.env.COMPASS_COLUMNSTORE_INDEXES = 'true';

    expect(hasColumnstoreIndexesSupport('')).to.be.true;
    expect(hasColumnstoreIndexesSupport('notasemver')).to.be.true;
    expect(hasColumnstoreIndexesSupport(undefined)).to.be.true;
    expect(hasColumnstoreIndexesSupport(null)).to.be.true;
  });
});
