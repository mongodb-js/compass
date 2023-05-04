import { expect } from 'chai';

import { queryHasProjection } from './query-has-projection';

describe('#queryHasProjection', function () {
  it('should return true with projection, false without', function () {
    expect(
      queryHasProjection({
        filter: { name: 'Arlo' },
        collation: { locale: 'simple' },
        projection: { name: 1 },
        limit: 100,
        skip: 1,
      })
    ).to.equal(true);

    expect(
      queryHasProjection({
        filter: { name: 'Arlo' },
        collation: { locale: 'simple' },
        limit: 100,
        skip: 1,
      })
    ).to.equal(false);

    expect(
      queryHasProjection({
        filter: {},
        projection: {},
      })
    ).to.equal(false);

    expect(
      queryHasProjection({
        filter: {},
        projection: { _id: false },
      })
    ).to.equal(true);
  });
});
