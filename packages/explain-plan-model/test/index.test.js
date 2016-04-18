var ExplainPlanModel = require('../');
var assert = require('assert');

describe('explain-plan-model', function() {
  context('Modern explain plans', function() {
    var explain;
    var model;

    beforeEach(function() {
      explain = require('./fixtures/simple_collscan_3.2.json');
      model = new ExplainPlanModel(explain, {parse: true});
    });

    it('should populate the model correctly', function() {
      assert.equal(model.namespace, 'mongodb.fanclub');
      assert.equal(model.nReturned, 1000000);
      assert.equal(model.executionTimeMillis, 188);
      assert.equal(model.totalKeysExamined, 0);
      assert.equal(model.totalDocsExamined, 1000000);
      // assert.equal(model.inMemorySort, false);
      // assert.equal(model.isSharded, false);
      // assert.equal(model.usedIndex, null);
      assert.deepEqual(model.rawExplainObject, explain);
      assert.ok(!model.legacyMode);
    });
  });

  context('Legacy explain plans', function() {
    var explain;
    var model;

    beforeEach(function() {
      explain = require('./fixtures/simple_collscan_2.6.json');
      model = new ExplainPlanModel(explain, {parse: true});
    });

    it('should populate the model correctly', function() {
      assert.equal(model.nReturned, 50051);
      assert.equal(model.executionTimeMillis, 19);
      assert.equal(model.totalKeysExamined, 50051);
      assert.equal(model.totalDocsExamined, 50051);
      // assert.equal(model.inMemorySort, false);
      // assert.equal(model.isSharded, false);
      // assert.equal(model.usedIndex, null);
      assert.deepEqual(model.rawExplainObject, explain);
      assert.ok(model.legacyMode);
    });
  });
});
