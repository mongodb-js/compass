import { expect } from 'chai';
import { changeFilter } from './change-filter';

describe('changeFilter', function () {
  describe('mergeGeoQuery', function () {
    it('only sets the filter', function () {
      const filter = { a: { $exists: true } };

      expect(
        changeFilter('mergeGeoQuery', filter, {
          coordinates: {
            $geoWithin: {
              $centerSphere: [[1, 2], 3],
            },
          },
        })
      ).to.deep.eq({
        a: { $exists: true },
        coordinates: {
          $geoWithin: {
            $centerSphere: [[1, 2], 3],
          },
        },
      });

      expect(
        changeFilter('mergeGeoQuery', filter, {
          $or: [
            {
              coordinates: {
                $geoWithin: {
                  $centerSphere: [[4, 5], 6],
                },
              },
            },
          ],
        })
      ).to.deep.eq({
        a: { $exists: true },
        $or: [
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
  });

  describe('addDistinctValue', function () {
    it('should add a distinct value to the filter state', function () {
      expect(
        changeFilter(
          'addDistinctValue',
          {},
          {
            field: 'name',
            value: 'pineapple',
          }
        )
      ).to.have.property('name', 'pineapple');
    });

    it('should start a $in if the field already exists with one primitive', function () {
      expect(
        changeFilter(
          'addDistinctValue',
          { name: 'winter' },
          {
            field: 'name',
            value: 'tomatoes',
          }
        )
      )
        .to.have.property('name')
        .deep.eq({
          $in: ['winter', 'tomatoes'],
        });
    });

    it('should add a value to an array if it already exists', function () {
      expect(
        changeFilter(
          'addDistinctValue',
          {
            name: {
              $in: ['e.t.', 'phone'],
            },
          },
          {
            field: 'name',
            value: 'home',
          }
        )
      )
        .to.have.property('name')
        .deep.eq({
          $in: ['e.t.', 'phone', 'home'],
        });
    });
  });
});
