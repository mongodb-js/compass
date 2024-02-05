import { expect } from 'chai';

import { isAtlasVectorSearchSupportedForServerVersion } from './vector-search-indexes';

describe('isAtlasVectorSearchSupportedForServerVersion', function () {
  it(`returns false for < 6.0.11`, function () {
    expect(isAtlasVectorSearchSupportedForServerVersion('4.2.0')).to.be.false;
    expect(isAtlasVectorSearchSupportedForServerVersion('4.4.0')).to.be.false;
    expect(isAtlasVectorSearchSupportedForServerVersion('5.0.0')).to.be.false;
    expect(isAtlasVectorSearchSupportedForServerVersion('6.0.1')).to.be.false;
  });

  it(`returns false for < 7.0.2`, function () {
    expect(isAtlasVectorSearchSupportedForServerVersion('7.0.1')).to.be.false;
  });

  it(`returns true for >= 6.0.11`, function () {
    expect(isAtlasVectorSearchSupportedForServerVersion('6.0.11')).to.be.true;
    expect(isAtlasVectorSearchSupportedForServerVersion('6.2.0')).to.be.true;
  });

  it(`returns true for >= 7.0.2`, function () {
    expect(isAtlasVectorSearchSupportedForServerVersion('7.0.2')).to.be.true;
    expect(isAtlasVectorSearchSupportedForServerVersion('7.5.0')).to.be.true;
    expect(isAtlasVectorSearchSupportedForServerVersion('20.2.0')).to.be.true;
  });

  it('returns true for invalid versions', function () {
    expect(isAtlasVectorSearchSupportedForServerVersion('')).to.be.true;
    expect(isAtlasVectorSearchSupportedForServerVersion('notasemver')).to.be
      .true;
    expect(isAtlasVectorSearchSupportedForServerVersion(undefined)).to.be.true;
    expect(isAtlasVectorSearchSupportedForServerVersion(null)).to.be.true;
  });
});
