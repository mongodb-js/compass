import { expect } from 'chai';
import { getAtlasSearchIndexesLink } from './atlas-search-indexes-link';

describe('getAtlasSearchIndexesLink', function () {
  it('returns the correct link with clusterName', function () {
    expect(
      getAtlasSearchIndexesLink({ clusterName: 'abc', namespace: 'foo.bar' })
    ).to.equal('#/clusters/atlasSearch/abc?database=foo&collectionName=bar');
  });

  it('encodes the clusterName', function () {
    expect(
      getAtlasSearchIndexesLink({
        clusterName: 'a b c',
        namespace: 'b u z.a@b@c',
      })
    ).to.equal(
      '#/clusters/atlasSearch/a%20b%20c?database=b%20u%20z&collectionName=a%40b%40c'
    );
  });
});
