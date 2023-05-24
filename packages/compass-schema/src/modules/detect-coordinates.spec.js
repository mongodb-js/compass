const detect = require('./detect-coordinates');
const assert = require('assert');
const legacyPairs = require('../../test/fixtures/legacy_pairs.json');
const geoJSONTemplate = require('../../test/fixtures/geo_json.json');
const unpromotedDoublesTemplate = require('../../test/fixtures/unpromoted_doubles.json');
const _ = require('lodash');

describe('detect-coordinates', function () {
  describe('GeoJSON Documents', function () {
    let geoJSON;
    beforeEach(function () {
      geoJSON = _.cloneDeep(geoJSONTemplate);
    });

    it('should work with real GeoJSON coordinates', function () {
      assert.ok(detect(geoJSON));
    });

    it('should return a zipped array of coordinates', function () {
      const result = detect(geoJSON);
      assert.ok(_.isArray(result));
      assert.ok(_.isArray(result[0]));
      assert.equal(result[0].length, 2);
    });

    it('should fail if document has less than 2 nested fields', function () {
      delete geoJSON.fields[1];
      assert.equal(detect(geoJSON), false);
    });

    it('should fail if `fields` is not an array', function () {
      geoJSON.fields = { foo: 1, bar: 1 };
      assert.equal(detect(geoJSON), false);
    });

    it('should fail if `type` or `coordinates` fields are not present', function () {
      geoJSON.fields[0].name = 'foo';
      assert.equal(detect(geoJSON), false);
    });

    it('should fail if not all the `type` values are "Point"', function () {
      const typeField = _.find(geoJSON.fields, ['name', 'type']);
      typeField.types[0].values[16] = 'Polygon';
      assert.equal(detect(geoJSON), false);
    });

    it('should fail if coordinates field has more than one type', function () {
      const coordinatesField = _.find(geoJSON.fields, ['name', 'coordinates']);
      coordinatesField.types.push({ foo: 1 });
      assert.equal(detect(geoJSON), false);
    });

    it('should fail if coordinates field type is not `Array`', function () {
      const coordinatesField = _.find(geoJSON.fields, ['name', 'coordinates']);
      coordinatesField.types[0].name = 'Boolean';
      assert.equal(detect(geoJSON), false);
    });

    it('should run the legacy pair checks on the `coordinates` field', function () {
      const coordinatesField = _.find(geoJSON.fields, ['name', 'coordinates']);
      coordinatesField.types[0].types[0].values[0] = -200; // outside longitude bounds
      assert.equal(detect(geoJSON), false);
    });
  });

  describe('Legacy Coordinate Pairs', function () {
    it('should work with real legacy coordinate pairs', function () {
      assert.ok(detect(legacyPairs));
    });

    it('should return a zipped array of coordinates', function () {
      const result = detect(legacyPairs);
      assert.ok(_.isArray(result));
      assert.ok(_.isArray(result[0]));
      assert.equal(result[0].length, 2);
    });

    it('should work with mock legacy coordinate pairs', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
        lengths: [2, 2, 2, 2],
        hasDuplicates: true,
        averageLength: 2,
        types: [
          {
            name: 'Number',
            count: 8,
            path: 'some.path',
            probability: 1,
            values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 20],
          },
        ],
      };
      assert.ok(detect(input));
    });

    it('should fail when abs(longitude) > 180', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
        lengths: [2, 2, 2, 2],
        hasDuplicates: true,
        averageLength: 2,
        types: [
          {
            name: 'Number',
            count: 8,
            path: 'some.path',
            probability: 1,
            values: [1, 2, 3, 4, 5, 6, 181, 8, 9, 20],
          },
        ],
      };
      assert.equal(detect(input), false);
    });

    it('should fail when abs(latitude) > 90', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
        lengths: [2, 2, 2, 2],
        hasDuplicates: true,
        averageLength: 2,
        types: [
          {
            name: 'Number',
            count: 8,
            path: 'some.path',
            probability: 1,
            values: [-170, 2, 3, -91, 5, 6, 180, 8, 9, 20],
          },
        ],
      };
      assert.equal(detect(input), false);
    });

    it('should fail if not every array length is equal to 2', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
        lengths: [2, 2, 0, 2],
        hasDuplicates: true,
        averageLength: 2,
        types: [
          {
            name: 'Number',
            count: 8,
            path: 'some.path',
            probability: 1,
            values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 20],
          },
        ],
      };
      assert.equal(detect(input), false);
    });

    it('should fail if the type does not have a `lengths` field', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
      };
      assert.equal(detect(input), false);
    });
    it('should fail if the type does not have a `types` field', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
        lengths: [2, 2, 2],
      };
      assert.equal(detect(input), false);
    });
    it('should fail if it has more than one array type', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
        lengths: [2, 2, 2, 2],
        hasDuplicates: true,
        averageLength: 2,
        types: [
          {
            name: 'Number',
            count: 8,
            path: 'some.path',
            probability: 1,
            values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 20],
          },
          {
            name: 'String',
            count: 8,
            path: 'some.path',
            probability: 1,
            values: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          },
        ],
      };
      assert.equal(detect(input), false);
    });
    it('should fail if the inner type is not `Number`', function () {
      const input = {
        name: 'Array',
        count: 4,
        path: 'some.path',
        lengths: [2, 2, 2, 2],
        hasDuplicates: true,
        averageLength: 2,
        types: [
          {
            name: 'String',
            count: 8,
            path: 'some.path',
            probability: 1,
            values: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
          },
        ],
      };
      assert.equal(detect(input), false);
    });
  });

  describe('GeoJSON with unpromoted Double values', function () {
    let geoJSON;
    beforeEach(function () {
      geoJSON = _.cloneDeep(unpromotedDoublesTemplate);
    });

    it('should detect the GeoJSON coordinates', function () {
      assert.ok(detect(geoJSON));
    });
  });
});
