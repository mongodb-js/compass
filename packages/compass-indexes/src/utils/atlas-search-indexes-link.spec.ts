import { expect } from 'chai';
import { getAtlasSearchIndexesLink } from './atlas-search-indexes-link';

describe('getAtlasSearchIndexesLink', function () {
  it('returns the correct link with clusterName', function () {
    expect(getAtlasSearchIndexesLink({ clusterName: 'abc' })).to.equal(
      '#/clusters/atlasSearch/abc'
    );
    expect(getAtlasSearchIndexesLink({ clusterName: '' })).to.equal(
      '#/clusters/atlasSearch/'
    );
  });

  it('encodes the clusterName', function () {
    expect(getAtlasSearchIndexesLink({ clusterName: 'a b c' })).to.equal(
      '#/clusters/atlasSearch/a%20b%20c'
    );
  });
});
