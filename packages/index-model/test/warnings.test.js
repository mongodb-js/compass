var assert = require('assert');
var WarningsMixin = require('../lib/warnings').mixin;
var IndexCollection = require('../').Collection;
// var debug = require('debug')('mongodb-index-model:test:warnings');

var INDEX_FIXTURE = require('./fixture');
var INDEX_BUGSNAG_FIXTURE = require('./fixture-bugsnag');

var IndexWithWarningsCollection = IndexCollection.extend(WarningsMixin);

describe('Index Warnings', function() {
  var indexes;
  var bugsnagIndexes;
  beforeEach(function() {
    indexes = new IndexWithWarningsCollection(INDEX_FIXTURE, {parse: true});
    bugsnagIndexes = new IndexWithWarningsCollection(INDEX_BUGSNAG_FIXTURE, {parse: true});
  });

  context('IXWARN_PREFIX', function() {
    it('should warn if an index is a prefix of another index', function() {
      var idx = indexes.get('email_1_favorite_features_1', 'name');
      // prevent trigger of IXWARN_UNUSED here
      idx.usageCount = 1000;

      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length > 0);
      assert.ok(idx.warnings.at(0).message.match(/Prefix of Another Index/));
      assert.ok(idx.warnings.at(0).details.match(/big-index/));
    });

    it('should not warn on the longer of the two indexes', function() {
      var idx = indexes.get('big-index', 'name');
      idx.usageCount = 1000;
      indexes.updateIndexWarnings();
      assert.equal(idx.warnings.length, 0);
    });

    it('should warn if two indexes are identical', function() {
      indexes.add({
        'v': 1,
        'key': {
          'last_login': -1
        },
        'name': 'dupe',
        'ns': 'mongodb.fanclub'
      }, {parse: true});
      var idx = indexes.get('last_login_-1', 'name');
      idx.usageCount = 1000;
      var dupeIdx = indexes.get('dupe', 'name');
      dupeIdx.usageCount = 1000;
      indexes.updateIndexWarnings();
      assert.equal(idx.warnings.length, 1);
      assert.equal(dupeIdx.warnings.length, 1);
    });

    it('should not warn when sort orders are different', function() {
      var idx = indexes.get('seniors', 'name');
      idx.usageCount = 1000;
      indexes.updateIndexWarnings();
      assert.equal(idx.warnings.length, 0);
    });

    it('should not warn if the index is the default _id index', function() {
      var idx = indexes.get('_id_', 'name');
      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length === 0);
    });

    it('should remove the warning if the condition has changed', function() {
      indexes.add({
        'v': 1,
        'key': {
          'last_login': -1
        },
        'name': 'dupe',
        'ns': 'mongodb.fanclub'
      }, {parse: true});

      var idx = indexes.get('last_login_-1', 'name');
      idx.usageCount = 50;
      indexes.updateIndexWarnings();

      assert.ok(idx.warnings.length === 1);
      indexes.remove('mongodb.fanclub.dupe');
      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length === 0);
    });
  });

  context('IXWARN_UNUSED', function() {
    it('should warn if an index is not used', function() {
      var idx = indexes.get('last_position_2dsphere', 'name');
      // force trigger of IXWARN_UNUSED here
      idx.usageCount = 0;

      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length > 0);
      assert.ok(idx.warnings.at(0).message.match(/Unused Index/));
      assert.ok(idx.warnings.at(0).details.match(/never been used/));
    });

    it('should not warn if the index is the default _id index', function() {
      var idx = indexes.get('_id_', 'name');
      idx.usageCount = 0;
      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length === 0);
    });

    it('should not add multiple warnings of the same type', function() {
      var idx = indexes.get('seniors', 'name');
      idx.usageCount = 0;
      indexes.updateIndexWarnings();
      indexes.updateIndexWarnings();
      indexes.updateIndexWarnings();
      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length === 1);
    });

    it('should remove the warning if the condition has changed', function() {
      var idx = indexes.get('seniors', 'name');
      idx.usageCount = 0;
      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length === 1);
      idx.usageCount = 1;
      indexes.updateIndexWarnings();
      assert.ok(idx.warnings.length === 0);
    });
  });

  context('IXWARN_KEY_PATTERN', function() {
    it('warns boolean true is not valid in 3.4+', function() {
      bugsnagIndexes.updateIndexWarnings();
      var index = bugsnagIndexes.get('b_true', 'name');
      assert.ok(index.warnings.length === 1);
      assert.ok(index.warnings.at(0).message.match(/Index Key Pattern is not valid/));
    });

    it('warns 0 is not valid in 3.4+', function() {
      bugsnagIndexes.updateIndexWarnings();
      var index = bugsnagIndexes.get('b_0', 'name');
      assert.ok(index.warnings.length === 1);
      assert.ok(index.warnings.at(0).message.match(/Index Key Pattern is not valid/));
    });
  });
});
