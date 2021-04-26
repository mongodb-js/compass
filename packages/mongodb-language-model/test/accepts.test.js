var language = require('../');
var assert = require('assert');

function accepts(str) {
  assert.ok(language.accepts(str));
}

function rejects(str) {
  assert.ok(!language.accepts(str));
}

describe('accepts', function() {
  it('should be requireable', function() {
    assert.ok(language);
  });

  describe('General Acceptance', function() {
    it('should accept a simple query', function() {
      accepts('{"foo": "bar"}');
    });
    it('should accept an empty query', function() {
      accepts('{}');
    });
    it('should accept a dotted field name', function() {
      accepts('{"foo.bar": true}');
    });
  });

  describe('Simple Leaf Values', function() {
    it('should accept a number value', function() {
      accepts('{"foo": 1}');
    });
    it('should accept a decimal number value', function() {
      accepts('{"foo": 1.23}');
    });
    it('should accept a negative number value', function() {
      accepts('{"foo": -8}');
    });
    it('should accept a string value', function() {
      accepts('{"foo": "bar"}');
    });
    it('should accept a null value', function() {
      accepts('{"foo": null}');
    });
    it('should accept a boolean value', function() {
      accepts('{"foo": false}');
    });
  });

  describe('Extended JSON Leaf Values', function() {
    it('should accept a regular expression', function() {
      accepts('{"foo": {"$regex": "^bar"}}');
      accepts('{"foo": {"$regex": "^bar", "$options": "gi"}}');
    });

    it('should reject a regular expression with invalid options', function() {
      rejects('{"foo": {"$regex": "^bar", "$options": "uvw"}}');
    });

    it('should accept ObjectIds', function() {
      accepts('{"_id": {"$oid": "57d64ffce97e2f2f90f37ccd"}}');
    });

    it('should reject ObjectIds with invalid id length', function() {
      rejects('{"_id": {"$oid": "5f37ccd"}}');
    });

    it('should accept Undefined', function() {
      accepts('{"_id": {"$undefined": true}}');
    });

    it('should accept MinKey', function() {
      accepts('{"lower": {"$minKey": 1}}');
    });

    it('should accept MaxKey', function() {
      accepts('{"upper": {"$maxKey": 1}}');
    });

    it('should accept NumberLong values', function() {
      accepts('{"epoch": {"$numberLong": "12345678901234567890"}}');
    });

    it('should reject NumberLong values that are unquoted', function() {
      rejects('{"epoch": {"$numberLong": 1234567890}}');
    });

    it('should accept negative NumberLong values', function() {
      accepts('{"epoch": {"$numberLong": "-23434"}}');
    });

    it('should accept NumberDecimal values', function() {
      accepts('{"epoch": {"$numberDecimal": "1.234"}}');
    });

    it('should accept negative NumberDecimal values', function() {
      accepts('{"epoch": {"$numberDecimal": "-1.234"}}');
    });

    it('should reject empty NumberDecimal values', function() {
      rejects('{"epoch": {"$numberDecimal": ""}}');
    });

    it('should reject NumberDecimal values that are unquoted', function() {
      rejects('{"epoch": {"$numberDecimal": 1.234}}');
    });

    it('should accept Timestamp values', function() {
      accepts('{"ts": {"$timestamp": {"t": 5, "i": 0}}}');
    });

    it('should reject incomplete Timestamp values', function() {
      rejects('{"ts": {"$timestamp": {"t": 5}}}');
      rejects('{"ts": {"$timestamp": {"i": 5}}}');
    });

    it('should accept Dates in ISO-8601 form', function() {
      accepts('{"_id": {"$date": "1978-09-29T03:04:05.006Z"}}');
    });

    it('should accept Dates in $numberLong form', function() {
      accepts('{"_id": {"$date": {"$numberLong": "1473838623000"}}}');
    });

    it('should accept Binary values', function() {
      accepts('{"payload": {"$binary": "1234==", "$type": "3"}}');
    });

    it('should reject Binary values without a type', function() {
      rejects('{"payload": {"$binary": "1234=="}}');
    });

    it('should accept DBRef values', function() {
      accepts('{"link": {"$ref": "foo.bar", "$id": {"$oid": "57d64ffce97e2f2f90f37ccd"}}}');
    });
  });

  describe('Value Operators', function() {
    it('should accept $gt / $gte operator', function() {
      accepts('{"foo": {"$gt": 20}}');
      accepts('{"foo": {"$gt": 20}}');
    });

    it('should accept $lt / $lte operator', function() {
      accepts('{"foo": {"$lt": 20}}');
      accepts('{"foo": {"$lte": 20}}');
    });

    it('should accept $eq / $ne operator', function() {
      accepts('{"foo": {"$eq": 20}}');
      accepts('{"foo": {"$ne": 20}}');
    });

    it('should accept $exists operator', function() {
      accepts('{"foo": {"$exists": true}}');
      accepts('{"foo": {"$exists": false}}');
    });

    it('should accept $type operator', function() {
      accepts('{"foo": {"$type": 3}}');
      accepts('{"foo": {"$type": "string"}}');
    });

    it('should accept $size operator', function() {
      accepts('{"foo": {"$size": 10}}');
    });

    it('should accept $regex operator without options (via leaf value)', function() {
      accepts('{"foo": {"$regex": "^foo"}}');
    });

    it('should accept $regex operator with options (via leaf value)', function() {
      accepts('{"foo": {"$regex": "^foo", "$options": "ig"}}');
    });
  });

  describe('List Operators', function() {
    it('should accept $in operator', function() {
      accepts('{"foo": {"$in": [1, 2, 3]}}');
      accepts('{"foo": {"$in": []}}');
      accepts('{"foo": {"$in": ["a", null, false, 4.35]}}');
    });

    it('should reject $in operator without an array', function() {
      rejects('{"foo": {"$in": "bar"}}');
      rejects('{"foo": {"$in": 3}}');
      rejects('{"foo": {"$in": {"a": 1}}}');
    });

    it('should accept $nin operator', function() {
      accepts('{"foo": {"$nin": [1, 2, 3]}}');
      accepts('{"foo": {"$nin": []}}');
      accepts('{"foo": {"$nin": ["a", null, false, 4.35]}}');
    });

    it('should accept $all operator', function() {
      accepts('{"tags":{"$all":["ssl","security"]}}');
      accepts('{"tags":{"$all":[["ssl","security"]]}}');
    });
  });

  describe('Operator Expression Operators', function() {
    it('should accept $elemMatch in its expression form', function() {
      accepts('{"results": {"$elemMatch": {"product": "xyz", "score": {"$gte": 8}}}}');
    });
    it('should accept $elemMatch in its operator form', function() {
      accepts('{"results": {"$elemMatch": {"$gte": 8, "$lt": 20}}}');
    });
    it('should reject $elemMatch in a top-level operator position', function() {
      rejects('{"$elemMatch": {"name": {"$exists": true}}}');
    });
    it('should reject $elemMatch in a value-operator position', function() {
      rejects('{"name": {"$elemMatch": true}}}');
    });
    it('should accept $not with an operator object as its value', function() {
      accepts('{"names": {"$exists": true, "$not": {"$size": 0}}}');
    });
    it('should accept $not with a complex operator object as its value', function() {
      accepts('{"names": {"$not": {"$exists": true, "$size": 0}}}');
    });
    it('should accept $not in combination with a $regex operator without options', function() {
      accepts('{"name": {"$not": {"$regex": "^Th"}}}');
    });
    it('should accept $not in combination with a $regex operator with options', function() {
      accepts('{"name": {"$not": {"$regex": "^Th", "$options": "g"}}}');
    });
    it('should reject $not in combination with an invalid $regex operator', function() {
      rejects('{"name": {"$not": {"$regex": "^Th", "$legitimate": "false"}}}');
    });
    it('should reject $elemMatch in combination with a $regex operator', function() {
      rejects('{"name": {"$elemMatch": {"$regex": "^Th"}}}');
    });
    it('should reject $not in a top-level operator position', function() {
      rejects('{"$not": {"name": {"$exists": true}}}');
    });
    it('should reject $not as a value-operator position', function() {
      rejects('{"name": {"$not": true}}}');
    });
  });

  describe('Geo operators', function() {
    describe('$geoWithin', function() {
      it('should accept a $geoWithin query with $centerSphere legacy shape', function() {
        accepts('{"loc":{"$geoWithin":{"$centerSphere":[[-87.71,38.64],0.03]}}}');
      });

      it('should accept a $geoWithin query with $center legacy shape', function() {
        accepts('{"loc":{"$geoWithin":{"$center":[[-87.71,38.64],0.03]}}}');
      });

      it('should accept a $geoWithin query with $box legacy shape', function() {
        accepts('{"loc":{"$geoWithin":{"$box":[[0,0],[100,100]]}}}');
      });

      it('should accept a $geoWithin query with $polygon legacy shape', function() {
        accepts('{"loc":{"$geoWithin":{"$polygon":[[0,0],[100,100],[1,4],[1,5]]}}}');
      });

      it('should accept a $geoWithin query with Polygon $geometry without hole', function() {
        accepts(`{
          "loc": {
            "$geoWithin": {
              "$geometry": {
                "type": "Polygon",
                "coordinates": [
                  [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
                ]
              }
            }
          }
        }`);
      });

      it('should accept a $geoWithin query with Polygon $geometry with hole', function() {
        accepts(`{
          "loc": {
            "$geoWithin": {
              "$geometry": {
                "type": "Polygon",
                "coordinates": [
                  [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
                  [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
                ]
              }
            }
          }
        }`);
      });

      it('should accept a $geoWithin query with MultiPolygon $geometry', function() {
        accepts(`{
          "loc": {
            "$geoWithin": {
              "$geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                  [
                    [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]
                  ],
                  [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                  ]
                ]
              }
            }
          }
        }`);
      });
    });

    describe('$geoIntersects', function() {
      it('should reject a $geoIntersects query with $centerSphere legacy shape', function() {
        rejects('{"loc":{"$geoIntersects":{"$centerSphere":[[-87.71,38.64],0.03]}}}');
      });

      it('should reject a $geoIntersects query with $center legacy shape', function() {
        rejects('{"loc":{"$geoIntersects":{"$center":[[-87.71,38.64],0.03]}}}');
      });

      it('should reject a $geoIntersects query with $box legacy shape', function() {
        rejects('{"loc":{"$geoIntersects":{"$box":[[0,0],[100,100]]}}}');
      });

      it('should reject a $geoIntersects query with $polygon legacy shape', function() {
        rejects('{"loc":{"$geoIntersects":{"$polygon":[[0,0],[100,100],[1,4],[1,5]]}}}');
      });

      it('should accept a $geoIntersects query with Polygon $geometry without hole', function() {
        accepts(`{
          "loc": {
            "$geoIntersects": {
              "$geometry": {
                "type": "Polygon",
                "coordinates": [
                  [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ]
                ]
              }
            }
          }
        }`);
      });

      it('should accept a $geoIntersects query with Polygon $geometry with hole', function() {
        accepts(`{
          "loc": {
            "$geoIntersects": {
              "$geometry": {
                "type": "Polygon",
                "coordinates": [
                  [ [100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0] ],
                  [ [100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2] ]
                ]
              }
            }
          }
        }`);
      });

      it('should accept a $geoIntersects query with MultiPolygon $geometry', function() {
        accepts(`{
          "loc": {
            "$geoIntersects": {
              "$geometry": {
                "type": "MultiPolygon",
                "coordinates": [
                  [
                    [[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]
                  ],
                  [
                    [[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
                    [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]
                  ]
                ]
              }
            }
          }
        }`);
      });
    });

    describe('$near', function() {
      it('should accept a $near query with Point $geometry coordinates specifying valid longitude and latitude values', function() {
        accepts(`{
          "loc": {
            "$near": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              }
            }
          }
        }`);
      });

      it('should reject a $near query with an invalid $geometry type', function() {
        rejects(`{
          "loc": {
            "$near": {
              "$geometry": {
                "type": "Polygon",
                "coordinates": [-87.71, 38.64]
              }
            }
          }
        }`);
      });

      it('should reject a $near query with Point $geometry coordinates specifying invalid longitude and latitude values', function() {
        rejects(`{
          "loc": {
            "$near": {
              "$geometry": {
                "type": "Point",
                "coordinates": [180.71, -91.1]
              }
            }
          }
        }`);
      });

      it('should accept a $near query with Point $geometry with $minDistance limit', function() {
        accepts(`{
          "loc": {
            "$near": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$minDistance": 1000
            }
          }
        }`);
      });

      it('should accept a $near query with Point $geometry with $maxDistance limit', function() {
        accepts(`{
          "loc": {
            "$near": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$maxDistance": 5000
            }
          }
        }`);
      });

      it('should accept a $near query with Point $geometry with $minDistance and $maxDistance limits', function() {
        accepts(`{
          "loc": {
            "$near": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$minDistance": 1000,
              "$maxDistance": 5000
            }
          }
        }`);

        // Test with the order of the limits flipped ($maxDistance then $minDistance)
        accepts(`{
          "loc": {
            "$near": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$maxDistance": 5000,
              "$minDistance": 1000
            }
          }
        }`);
      });

      it('should accept a $near query with legacy coordinates specifying valid longitude and latitude values', function() {
        accepts(`{
          "loc": {
            "$near": [-87.71, 38.64]
          }
        }`);
      });

      it('should reject a $near query with legacy coordinates specifying invalid longitude and latitude values', function() {
        rejects(`{
          "loc": {
            "$near": [180.71, -91.1]
          }
        }`);
      });

      it('should accept a $near query with legacy coordinates with $minDistance limit', function() {
        accepts(`{
          "loc": {
            "$near": [-87.71, 38.64],
            "$minDistance": 1000
          }
        }`);
      });

      it('should accept a $near query with legacy coordinates with $maxDistance limit', function() {
        accepts(`{
          "loc": {
            "$near": [-87.71, 38.64],
            "$maxDistance": 5000
          }
        }`);
      });

      it('should accept a $near query with legacy coordinates with $minDistance and $maxDistance limits', function() {
        accepts(`{
          "loc": {
            "$near": [-87.71, 38.64],
            "$minDistance": 1000,
            "$maxDistance": 5000
          }
        }`);

        // Test with the order of the limits flipped ($maxDistance then $minDistance)
        accepts(`{
          "loc": {
            "$near": [-87.71, 38.64],
            "$maxDistance": 5000,
            "$minDistance": 1000
          }
        }`);
      });
    });

    describe('$nearSphere', function() {
      it('should accept a $nearSphere query with Point $geometry coordinates specifying valid longitude and latitude values', function() {
        accepts(`{
          "loc": {
            "$nearSphere": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              }
            }
          }
        }`);
      });

      it('should reject a $nearSphere query with an invalid $geometry type', function() {
        rejects(`{
          "loc": {
            "$nearSphere": {
              "$geometry": {
                "type": "Polygon",
                "coordinates": [-87.71, 38.64]
              }
            }
          }
        }`);
      });

      it('should reject a $nearSphere query with Point $geometry coordinates specifying invalid longitude and latitude values', function() {
        rejects(`{
          "loc": {
            "$nearSphere": {
              "$geometry": {
                "type": "Point",
                "coordinates": [180.71, -91.1]
              }
            }
          }
        }`);
      });

      it('should accept a $nearSphere query with Point $geometry with $minDistance limit', function() {
        accepts(`{
          "loc": {
            "$nearSphere": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$minDistance": 1000
            }
          }
        }`);
      });

      it('should accept a $nearSphere query with Point $geometry with $maxDistance limit', function() {
        accepts(`{
          "loc": {
            "$nearSphere": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$maxDistance": 5000
            }
          }
        }`);
      });

      it('should accept a $nearSphere query with Point $geometry with $minDistance and $maxDistance limits', function() {
        accepts(`{
          "loc": {
            "$nearSphere": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$minDistance": 1000,
              "$maxDistance": 5000
            }
          }
        }`);

        // Test with the order of the limits flipped ($maxDistance then $minDistance)
        accepts(`{
          "loc": {
            "$nearSphere": {
              "$geometry": {
                "type": "Point",
                "coordinates": [-87.71, 38.64]
              },
              "$maxDistance": 5000,
              "$minDistance": 1000
            }
          }
        }`);
      });

      it('should accept a $nearSphere query with legacy coordinates specifying valid longitude and latitude values', function() {
        accepts(`{
          "loc": {
            "$nearSphere": [-87.71, 38.64]
          }
        }`);
      });

      it('should reject a $nearSphere query with legacy coordinates specifying invalid longitude and latitude values', function() {
        rejects(`{
          "loc": {
            "$nearSphere": [180.71, -91.1]
          }
        }`);
      });

      it('should accept a $nearSphere query with legacy coordinates with $minDistance limit', function() {
        accepts(`{
          "loc": {
            "$nearSphere": [-87.71, 38.64],
            "$minDistance": 1000
          }
        }`);
      });

      it('should accept a $nearSphere query with legacy coordinates with $maxDistance limit', function() {
        accepts(`{
          "loc": {
            "$nearSphere": [-87.71, 38.64],
            "$maxDistance": 5000
          }
        }`);
      });

      it('should accept a $nearSphere query with legacy coordinates with $minDistance and $maxDistance limits', function() {
        accepts(`{
          "loc": {
            "$nearSphere": [-87.71, 38.64],
            "$minDistance": 1000,
            "$maxDistance": 5000
          }
        }`);

        // Test with the order of the limits flipped ($maxDistance then $minDistance)
        accepts(`{
          "loc": {
            "$nearSphere": [-87.71, 38.64],
            "$maxDistance": 5000,
            "$minDistance": 1000
          }
        }`);
      });
    });
  });

  describe('Expressions as top level operator', function() {
    it('should accept simple $expr operator', function() {
      accepts('{"$expr": {"$gt": ["$sold", "$total"]}}');
    });
  });

  describe('Expressions as nested operator', function() {
    it('should accept simple $expr operator', function() {
      accepts('{"$and": [{"foo": 1}, {"$expr": {"$gt": ["$sold", "$total"]}}]}');
    });
  });

  describe('Logical Expression Trees', function() {
    it('should accept simple $and expressions', function() {
      accepts('{"$and": [{"foo": 1}, {"bar": 1}]}');
      accepts('{"$and": [{"foo": {"$gt": 1}}]}');
      accepts('{"$and": []}');
    });

    it('should accept simple $or expressions', function() {
      accepts('{"$or": [{"foo": 1}, {"bar": 1}]}');
      accepts('{"$or": [{"foo": {"$gt": 1}}]}');
      accepts('{"$or": []}');
    });

    it('should accept simple $nor expressions', function() {
      accepts('{"$nor": [{"foo": 1}, {"bar": 1}]}');
      accepts('{"$nor": [{"foo": {"$gt": 1}}]}');
      accepts('{"$nor": []}');
    });

    it('should accept mixed, nested expression trees', function() {
      accepts(`{ "$or": [ { "a":1, "b": 2 }, { "$or": [ { "$nor": [
        { "c": true }, { "d": { "$exists": false } } ] }, { "e": 1 } ] } ] }`);
    });
  });

  describe('Where Clauses', function() {
    it('should accept a single $where clause with a string value', function() {
      accepts('{"$where": "this.age > 60;"}');
    });

    it('should accept a $where clause combined with a leaf-clause', function() {
      accepts('{"$where": "this.age > 60;", "membership_status": "ACTIVE"}');
    });
  });

  describe('Special queries', function() {
    it('accepts $bitsAllClear queries with arrays', function() {
      accepts('{ "a": { "$bitsAllClear": [ 1, 5 ] }}');
    });

    it('accepts $bitsAllClear queries with bitmasks', function() {
      accepts('{ "a": { "$bitsAllClear": 35 }}');
    });

    it('accepts $bitsAnyClear queries with arrays', function() {
      accepts('{ "a": { "$bitsAnyClear": [ 1, 5 ] }}');
    });

    it('accepts $bitsAnyClear queries with bitmasks', function() {
      accepts('{ "a": { "$bitsAnyClear": 35 }}');
    });

    it('accepts $bitsAllSet queries with arrays', function() {
      accepts('{ "a": { "$bitsAllClear": [ 1, 5 ] }}');
    });

    it('accepts $bitsAllSet queries with bitmasks', function() {
      accepts('{ "a": { "$bitsAllClear": 35 }}');
    });

    it('accepts $bitsAnySet queries with arrays', function() {
      accepts('{ "a": { "$bitsAnyClear": [ 1, 5 ] }}');
    });

    it('accepts $bitsAnySet queries with bitmasks', function() {
      accepts('{ "a": { "$bitsAnyClear": 35 }}');
    });

    it('accepts $text queries with $search', function() {
      accepts('{ "$text": { "$search": "coffee" } }');
    });

    it('accepts $text queries with $search & $language', function() {
      accepts('{ "$text": { "$search": "coffee", "$language": "es" } }');
    });

    it('accepts $text queries with $search and $caseSensitive', function() {
      accepts('{ "$text": { "$search": "coffee", "$caseSensitive": true } }');
    });

    it('accepts $mod queries', function() {
      accepts('{ "qty": { "$mod": [ 4, 0 ] } }');
    });
  });

  describe('Syntax Errors', function() {
    it('should reject an invalid string', function() {
      rejects('{"foo": bar}');
    });
    it('should reject an unquoted key', function() {
      rejects('{foo: "bar"}');
    });
    it('should reject an empty string', function() {
      rejects('');
    });
  });
});
