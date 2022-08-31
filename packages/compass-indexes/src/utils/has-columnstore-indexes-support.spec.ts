import { expect } from 'chai';

import { hasColumnstoreIndexesSupport } from './has-columnstore-indexes-support';

describe('hasColumnstoreIndexesSupport', function () {
  it('returns false for < 7.0.0', function () {
    expect(hasColumnstoreIndexesSupport('4.2.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('4.4.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('5.0.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('6.0.1')).to.be.false;
  });

  it('returns true for 7+', function () {
    expect(hasColumnstoreIndexesSupport('7.0.0')).to.be.true;
    expect(hasColumnstoreIndexesSupport('7.2.0')).to.be.true;
  });

  it('returns true for invalid versions', function () {
    expect(hasColumnstoreIndexesSupport('')).to.be.true;
    expect(hasColumnstoreIndexesSupport('notasemver')).to.be.true;
    expect(hasColumnstoreIndexesSupport(undefined)).to.be.true;
    expect(hasColumnstoreIndexesSupport(null)).to.be.true;
  });
});
