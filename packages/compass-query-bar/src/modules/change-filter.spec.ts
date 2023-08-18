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

  describe('clearValue', function () {
    it('should clear a value in the filter state', function () {
      const filter = { name: 'pineapple' };
      expect(
        changeFilter('clearValue', filter, {
          field: 'name',
        })
      ).to.not.have.property('name');
    });
  });

  describe('setValue', function () {
    it('should set a value in the filter state when the field does not exist', function () {
      expect(
        changeFilter(
          'setValue',
          {},
          {
            field: 'name',
            value: 'strawberry',
          }
        )
      ).to.have.property('name', 'strawberry');
    });

    it('should unset a new value in the filter state when unsetIfSet arg is sent', function () {
      const filter = { name: 'strawberry' };
      expect(
        changeFilter('setValue', filter, {
          field: 'name',
          value: 'strawberry',
          unsetIfSet: true,
        })
      ).to.not.have.property('name');
    });

    it('should set a new value in the filter state when the field already exists', function () {
      const filter = { name: 'pineapple' };
      expect(
        changeFilter('setValue', filter, {
          field: 'name',
          value: 'maracuja',
        })
      ).to.have.property('name', 'maracuja');
    });
  });
});
