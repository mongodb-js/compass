import { addLayer, generateGeoQuery } from 'modules/geo';

describe('geo module', () => {
  describe('#addLayer', () => {
    context('when the layer is a circle', () => {
      const layer = {
        _latlng: {
          lat: 1,
          lng: 1
        },
        _leaflet_id: 1,
        _mRadius: 1000
      };

      it('adds the circle layer', () => {
        expect(addLayer('field', layer, {})).to.deep.equal({
          1: {
            field: 'field',
            lat: 1,
            lng: 1,
            radius: 1000,
            type: 'circle'
          }
        });
      });
    });

    context('when the layer is a polygon', () => {
      const layer = {
        _latlngs: [
          [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }]
        ],
        _leaflet_id: 1,
      };

      it('adds the polygon layer and closes the ring', () => {
        expect(addLayer('field', layer, {})).to.deep.equal({
          1: {
            coordinates: [[[ 1, 1 ], [ 2, 2 ], [ 1, 1 ]]],
            field: 'field',
            type: 'polygon'
          }
        });
      });
    });
  });

  describe('#generateGeoQuery', () => {
    context('when there is one circle layer', () => {
      const layers = {
        1: { field: 'field', lat: 10, lng: 5, radius: 20, type: 'circle' }
      };

      it('returns the $geoWithin query', () => {
        expect(generateGeoQuery(layers)).to.deep.equal({
          field: { $geoWithin: { $centerSphere: [[ 5, 10], 0.0000031357044420535627 ]}},
        });
      });
    });

    context('when there are multiple circle layers', () => {
      const layers = {
        1: { field: 'field', lat: 10, lng: 5, radius: 20, type: 'circle' },
        2: { field: 'field', lat: 11, lng: 6, radius: 21, type: 'circle' }
      };

      it('returns the $or with all $geoWithin queries', () => {
        expect(generateGeoQuery(layers)).to.deep.equal({
          $or: [
            { field: { $geoWithin: { $centerSphere: [[ 5, 10], 0.0000031357044420535627 ]}}},
            { field: { $geoWithin: { $centerSphere: [[ 6, 11], 0.0000032924896641562407 ]}}}
          ]
        });
      });
    });

    context('when there is one polygon layer', () => {
      const coordinates = [[[ 0, 0 ], [ 1, 1 ], [ 2, 2 ], [ 0, 0 ]]];
      const layers = {
        1: {
          field: 'field',
          coordinates: coordinates,
          type: 'polygon'
        }
      };

      it('returns the geoJSON query', () => {
        expect(generateGeoQuery(layers)).to.deep.equal({
          field: {
            $geoWithin: {
              $geometry: {
                type: 'Polygon',
                coordinates: coordinates
              }
            }
          }
        });
      });
    });

    context('when there are multiple polygon layers', () => {
      const coordinates1 = [[[ 0, 0 ], [ 1, 1 ], [ 2, 2 ], [ 0, 0 ]]];
      const coordinates2 = [[[ 0, 0 ], [ 1, 1 ], [ 3, 3 ], [ 0, 0 ]]];
      const layers = {
        1: { field: 'field', coordinates: coordinates1, type: 'polygon' },
        2: { field: 'field', coordinates: coordinates2, type: 'polygon' }
      };

      it('returns the geoJSON query', () => {
        expect(generateGeoQuery(layers)).to.deep.equal({
          $or: [
            {
              field: {
                $geoWithin: {
                  $geometry: {
                    type: 'Polygon',
                    coordinates: coordinates1
                  }
                }
              }
            },
            {
              field: {
                $geoWithin: {
                  $geometry: {
                    type: 'Polygon',
                    coordinates: coordinates2
                  }
                }
              }
            }
          ]
        });
      });
    });

    context('when there is a circle/polygon mix', () => {
      const coordinates = [[[ 0, 0 ], [ 1, 1 ], [ 2, 2 ], [ 0, 0 ]]];
      const layers = {
        1: { field: 'field', coordinates: coordinates, type: 'polygon' },
        2: { field: 'field', lat: 10, lng: 5, radius: 20, type: 'circle' }
      };

      it('returns the geoJSON query', () => {
        expect(generateGeoQuery(layers)).to.deep.equal({
          $or: [
            {
              field: {
                $geoWithin: {
                  $geometry: {
                    type: 'Polygon',
                    coordinates: coordinates
                  }
                }
              }
            },
            {
              field: {
                $geoWithin: {
                  $centerSphere: [[ 5, 10], 0.0000031357044420535627 ]
                }
              }
            }
          ]
        });
      });
    });
  });
});
