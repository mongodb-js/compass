import { expect } from 'chai';

import {
  hasColumnstoreIndexesSupport,
  MIN_COLUMNSTORE_INDEXES_SERVER_VERSION,
} from './columnstore-indexes';

describe('hasColumnstoreIndexesSupport', function () {
  it(`returns false for < ${MIN_COLUMNSTORE_INDEXES_SERVER_VERSION}`, function () {
    expect(hasColumnstoreIndexesSupport('4.2.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('4.4.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('5.0.0')).to.be.false;
    expect(hasColumnstoreIndexesSupport('6.0.1')).to.be.false;
  });

  it(`returns true for ${MIN_COLUMNSTORE_INDEXES_SERVER_VERSION}`, function () {
    expect(hasColumnstoreIndexesSupport('20.0.0')).to.be.true;
    expect(hasColumnstoreIndexesSupport('20.2.0')).to.be.true;
  });

  it('returns true for invalid versions', function () {
    expect(hasColumnstoreIndexesSupport('')).to.be.true;
    expect(hasColumnstoreIndexesSupport('notasemver')).to.be.true;
    expect(hasColumnstoreIndexesSupport(undefined)).to.be.true;
    expect(hasColumnstoreIndexesSupport(null)).to.be.true;
  });
});
