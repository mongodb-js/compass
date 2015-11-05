var models = require('../models');
var assert = require('assert');

describe('LegacyShape', function() {
  var legacyShape;

  beforeEach(function() {
    legacyShape = new models.LegacyShape({ $centerSphere: [ [ -88, 30 ], 10 / 3963.2 ] }, {
      parse: true
    });
  });

  it('should be an instance of LegacyShape', function() {
    assert.ok(legacyShape instanceof models.LegacyShape);
  });

  it('should have a type of $centerSphere', function() {
    assert.ok(legacyShape.type === '$centerSphere');
  });

  it('should have an array of parameters', function() {
    assert.ok(Array.isArray(legacyShape.parameters));
  });

  it('should not allow unknown shape keys', function() {
    assert.throws(function() {
      /* eslint no-unused-vars: 0 */
      var invalidShape = new models.LegacyShape({$someInvalidShape: [1, 2, 3] }, {
        parse: true
      }, TypeError);
    });
  });

  it('should construct the buffer correctly from its inputs', function() {
    var input = { $centerSphere: [ [ -88, 30 ], 10 / 3963.2 ] };
    legacyShape = new models.LegacyShape(input, {
      parse: true
    });
    assert.deepEqual(legacyShape.buffer, input);
  });

  it('should not be valid for more than 2 array parameters', function() {
    var input = { $centerSphere: [ [ -88, 30 ], 10 / 3963.2, false /* invalid 3rd parameter */ ] };
    legacyShape = new models.LegacyShape(input, {
      parse: true
    });
    assert.equal(legacyShape.valid, false);
  });

  it('should not be valid for more or less than 2 coordinates', function() {
    var input = { $centerSphere: [ [ -88 /* missing 2nd coordinate */ ], 10 / 3963.2 ] };
    legacyShape = new models.LegacyShape(input, {
      parse: true
    });
    assert.equal(legacyShape.valid, false);
  });
});

describe('GeoOperator', function() {
  var geoop;

  describe('$geoWithin with polygon', function() {
    beforeEach(function() {
      geoop = new models.GeoOperator({
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: [ [ [ 0, 0 ], [ 3, 6 ], [ 6, 1 ], [ 0, 0 ] ] ]
          }
        }
      }, {
        parse: true
      });
    });

    it('should have a shape type of Geometry', function() {
      assert.ok(geoop.shape instanceof models.Geometry);
    });
  });

  describe('$geoWithin with legacy shapes', function() {
    beforeEach(function() {
      geoop = new models.GeoOperator({ $geoWithin: { $centerSphere: [ [ -88, 30 ], 10 / 3963.2 ] } }, {
        parse: true
      });
    });

    it('should be an instance of GeoOperator', function() {
      assert.ok(geoop instanceof models.GeoOperator);
    });

    it('should have a shape type of LegacyShape', function() {
      assert.ok(geoop.shape instanceof models.LegacyShape);
    });

    it('should refuse to parse an invalid shape definition', function() {
      assert.throws(function() {
        var invalidOp = new models.GeoOperator({ $geoWithin: { $centerHyperCube:
        [ [ -88, 30 ], 10 / 3963.2 ] } }, {
          parse: true
        });
      });
    });

    it('should listen to its shape\'s buffer:change events', function(done) {
      geoop.on('change:buffer', function() {
        assert.ok(!geoop.valid);
        done();
      });
      geoop.shape.parameters = [[ -54, 21.1 ], 20 / 3963.2, false];
    });
  });
});
