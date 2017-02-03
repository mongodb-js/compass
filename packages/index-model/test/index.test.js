var assert = require('assert');
var IndexCollection = require('../').Collection;
var _ = require('lodash');

var INDEX_FIXTURE = require('./fixture');
var INDEX_BUGSNAG_FIXTURE = require('./fixture-bugsnag');

describe('mongodb-index-model', function() {
  var indexes;
  var bugsnagIndexes;
  before(function() {
    indexes = new IndexCollection(INDEX_FIXTURE, {parse: true});
    bugsnagIndexes = new IndexCollection(INDEX_BUGSNAG_FIXTURE, {parse: true});
  });

  context('IndexModel', function() {
    it('should have all indexes in the collection', function() {
      assert.equal(indexes.length, 9);
    });

    it('should get the names right', function() {
      assert.deepEqual(indexes.pluck('name').sort(), [
        '$**_text',
        '_id_',
        '_id_1_gender_-1',
        'big-index',
        'email_1_favorite_features_1',
        'last_login_-1',
        'last_position_2dsphere',
        'seniors',
        'seniors-inverse']);
    });

    it('should have the correct namespace', function() {
      _.each(indexes.pluck('ns'), function(ns) {
        assert.equal(ns, 'mongodb.fanclub');
      });
    });

    it('should have the correct version', function() {
      _.each(indexes.pluck('version'), function(v) {
        assert.equal(v, 1);
      });
    });

    it('should set all derived properties to false for regular indexes', function() {
      var index = indexes.get('last_login_-1', 'name');
      assert.equal(index.unique, false);
      assert.equal(index.sparse, false);
      assert.equal(index.ttl, false);
      assert.equal(index.hashed, false);
      assert.equal(index.geo, false);
      assert.equal(index.compound, false);
      assert.equal(index.geo, false);
      assert.equal(index.partial, false);
      assert.equal(index.collation, false);
    });

    it('should recognize geo indexes', function() {
      assert.equal(indexes.get('last_position_2dsphere', 'name').geo, true);
    });

    it('should recognize compound indexes', function() {
      assert.equal(indexes.get('email_1_favorite_features_1', 'name').compound, true);
    });

    it('should return the correct `properties` array', function() {
      var index = indexes.get('seniors', 'name');
      assert.deepEqual(index.properties, ['partial']);
      index = indexes.get('last_login_-1', 'name');
      assert.deepEqual(index.properties, []);
      index = indexes.get('_id_', 'name');
      assert.deepEqual(index.properties, ['unique']);
    });

    it('should recognize text indexes', function() {
      assert.equal(indexes.get('$**_text', 'name').text, true);
    });

    it('should recognize unique indexes', function() {
      assert.equal(indexes.get('_id_', 'name').unique, true);
    });

    it('should recognize partial indexes', function() {
      assert.equal(indexes.get('seniors', 'name').partial, true);
      assert.deepEqual(indexes.get('seniors', 'name').extra.partialFilterExpression,
        {
          'age': {
            '$gt': 50
          }
        });
    });

    it('should serialize correctly', function() {
      var serialized = indexes.serialize();
      assert.ok(_.isArray(serialized));
      var index = serialized[0];
      assert.ok(index.ns);
      assert.ok(index.key);
      assert.ok(index.name);
      assert.ok(index.version);
      assert.ok(index.extra);
      assert.ok(index.type);
      assert.ok(index.cardinality);
      assert.ok('unique' in index);
      assert.ok('sparse' in index);
      assert.ok('ttl' in index);
      assert.ok('hashed' in index);
      assert.ok('geo' in index);
      assert.ok('compound' in index);
      assert.ok('partial' in index);
      assert.ok('text' in index);
    });
  });

  context('IndexField', function() {
    it('should accept numbers as index field values', function() {
      assert.equal(indexes.get('seniors', 'name').fields.at(0).field, 'name');
      assert.equal(indexes.get('seniors', 'name').fields.at(0).value, 1);
    });

    context('when created via a v3.4.x mongod and mongoshell', function() {
      it('should accept Infinity index field values', function() {
        assert.equal(bugsnagIndexes.get('a_Infinity', 'name').fields.at(0).field, 'a');
        assert.equal(bugsnagIndexes.get('a_Infinity', 'name').fields.at(0).value, Infinity);
      });

      it('should accept numbers less than -1 as index field values', function() {
        assert.equal(bugsnagIndexes.get('a_-2', 'name').fields.at(0).field, 'a');
        assert.equal(bugsnagIndexes.get('a_-2', 'name').fields.at(0).value, -2);
      });

      it('should accept floats as index field values', function() {
        assert.equal(bugsnagIndexes.get('a_0.1', 'name').fields.at(0).field, 'a');
        assert.equal(bugsnagIndexes.get('a_0.1', 'name').fields.at(0).value, 0.1);
      });
    });

    context('when created via a v3.2.x mongod and mongoshell', function() {
      // See https://jira.mongodb.org/browse/COMPASS-406
      // See https://app.bugsnag.com/mongodb/mongodb-compass/errors/581ea54b07b7add195ad49ce?event_id=585a8ea91c8db711005c6cb2
      // See https://jira.mongodb.org/browse/SERVER-11064
      it('should accept boolean true as index field values', function() {
        assert.equal(bugsnagIndexes.get('b_true', 'name').fields.at(0).field, 'b');
        assert.equal(bugsnagIndexes.get('b_true', 'name').fields.at(0).value, true);
      });
    });

    it('should accept dotted field names', function() {
      assert.equal(indexes.get('seniors', 'name').fields.at(1).field, 'address.city');
      assert.equal(indexes.get('seniors', 'name').fields.at(1).value, 1);
    });

    it('should accept selected strings as index field values', function() {
      assert.equal(indexes.get('last_position_2dsphere', 'name').fields.at(0).value, '2dsphere');
    });

    it('should correctly set the `geo` flag', function() {
      assert.equal(indexes.get('seniors', 'name').fields.at(0).geo, false);
      assert.equal(indexes.get('last_position_2dsphere', 'name').fields.at(0).geo, true);
    });
  });
});
