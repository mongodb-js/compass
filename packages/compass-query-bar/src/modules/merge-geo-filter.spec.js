import { expect } from 'chai';

import mergeGeoFilter from './merge-geo-filter';

function makeGeoQuery(lon, lat, radius) {
  return {
    $geoWithin: {
      $centerSphere: [[lon, lat], radius],
    },
  };
}

describe('mergeGeoFilter', function () {
  it('replaces previous coordinates geo filter', function () {
    let merged;

    merged = mergeGeoFilter(
      { coordinates: makeGeoQuery(1, 2, 3) },
      { coordinates: makeGeoQuery(4, 5, 6) }
    );

    expect(merged).to.deep.equal({
      coordinates: {
        $geoWithin: {
          $centerSphere: [[4, 5], 6],
        },
      },
    });

    merged = mergeGeoFilter(
      {
        'start location': makeGeoQuery(1, 2, 3),
        'end location': makeGeoQuery(4, 5, 6),
      },
      {
        'start location': makeGeoQuery(7, 8, 9),
        'end location': makeGeoQuery(10, 11, 12),
      }
    );

    expect(merged).to.deep.equal({
      'start location': {
        $geoWithin: {
          $centerSphere: [[7, 8], 9],
        },
      },
      'end location': {
        $geoWithin: {
          $centerSphere: [[10, 11], 12],
        },
      },
    });
  });

  it('replaces previous $or geo filter', function () {
    let merged;

    merged = mergeGeoFilter(
      {
        $or: [
          { coordinates: makeGeoQuery(1, 2, 3) },
          { coordinates: makeGeoQuery(4, 5, 6) },
        ],
      },
      {
        $or: [
          { coordinates: makeGeoQuery(7, 8, 9) },
          { coordinates: makeGeoQuery(10, 11, 12) },
        ],
      }
    );

    expect(merged).to.deep.equal({
      $or: [
        {
          coordinates: {
            $geoWithin: {
              $centerSphere: [[7, 8], 9],
            },
          },
        },
        {
          coordinates: {
            $geoWithin: {
              $centerSphere: [[10, 11], 12],
            },
          },
        },
      ],
    });

    merged = mergeGeoFilter(
      {
        $or: [
          { 'start location': makeGeoQuery(1, 2, 3) },
          { 'start location': makeGeoQuery(4, 5, 6) },
        ],
      },
      {
        $or: [
          { 'start location': makeGeoQuery(7, 8, 9) },
          { 'start location': makeGeoQuery(10, 11, 12) },
        ],
      }
    );

    expect(merged).to.deep.equal({
      $or: [
        {
          'start location': {
            $geoWithin: {
              $centerSphere: [[7, 8], 9],
            },
          },
        },
        {
          'start location': {
            $geoWithin: {
              $centerSphere: [[10, 11], 12],
            },
          },
        },
      ],
    });

    merged = mergeGeoFilter(
      {
        $or: [
          {
            'start location': makeGeoQuery(1, 2, 3),
            'end location': makeGeoQuery(1, 2, 3),
          },
          {
            'start location': makeGeoQuery(4, 5, 6),
            'end location': makeGeoQuery(4, 5, 6),
          },
        ],
      },
      {
        $or: [
          {
            'start location': makeGeoQuery(7, 8, 9),
            'end location': makeGeoQuery(7, 8, 9),
          },
          {
            'start location': makeGeoQuery(10, 11, 12),
            'end location': makeGeoQuery(10, 11, 12),
          },
        ],
      }
    );

    expect(merged).to.deep.equal({
      $or: [
        {
          'start location': {
            $geoWithin: {
              $centerSphere: [[7, 8], 9],
            },
          },
          'end location': {
            $geoWithin: {
              $centerSphere: [[7, 8], 9],
            },
          },
        },
        {
          'start location': {
            $geoWithin: {
              $centerSphere: [[10, 11], 12],
            },
          },
          'end location': {
            $geoWithin: {
              $centerSphere: [[10, 11], 12],
            },
          },
        },
      ],
    });
  });

  it('replaces previous coordinates with $or geo filter', function () {
    const merged = mergeGeoFilter(
      { coordinates: makeGeoQuery(1, 2, 3) },
      {
        $or: [
          { coordinates: makeGeoQuery(1, 2, 3) },
          { coordinates: makeGeoQuery(4, 5, 6) },
        ],
      }
    );

    expect(merged).to.deep.equal({
      $or: [
        {
          coordinates: {
            $geoWithin: {
              $centerSphere: [[1, 2], 3],
            },
          },
        },
        {
          coordinates: {
            $geoWithin: {
              $centerSphere: [[4, 5], 6],
            },
          },
        },
      ],
    });
  });

  it('keeps other properties unchanged', function () {
    expect(
      mergeGeoFilter({ x: 1 }, { coordinates: makeGeoQuery(1, 2, 3) }).x
    ).to.equal(1);

    expect(
      mergeGeoFilter(
        { x: 1 },
        {
          $or: [
            { coordinates: makeGeoQuery(1, 2, 3) },
            { coordinates: makeGeoQuery(4, 5, 6) },
          ],
        }
      ).x
    ).to.equal(1);
  });

  it('preserves other $or conditions', function () {
    const merged = mergeGeoFilter(
      {
        $or: [
          { coordinates: makeGeoQuery(1, 2, 3) },
          { coordinates: makeGeoQuery(4, 5, 6) },
          { x: 1 },
        ],
      },
      {
        $or: [
          { coordinates: makeGeoQuery(7, 8, 9) },
          { coordinates: makeGeoQuery(10, 11, 12) },
        ],
      }
    );

    expect(merged).to.deep.equal({
      $or: [
        { x: 1 },
        {
          coordinates: {
            $geoWithin: {
              $centerSphere: [[7, 8], 9],
            },
          },
        },
        {
          coordinates: {
            $geoWithin: {
              $centerSphere: [[10, 11], 12],
            },
          },
        },
      ],
    });
  });
});
