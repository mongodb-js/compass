var Model = require('ampersand-model');
var assign = require('lodash.assign');
var filter = require('lodash.filter');
var uniq = require('lodash.uniq');
var map = require('lodash.map');
var some = require('lodash.some');

var stageIterationMixin = require('./stage-iteration');

// var debug = require('debug')('mongodb-explain-plan-model:index');

var ExplainPlanModel = Model.extend(stageIterationMixin, {
  legacyMode: false,
  extraProperties: 'ignore',
  props: {
    namespace: 'string',
    parsedQuery: 'object',
    executionSuccess: 'boolean',
    nReturned: 'number',
    executionTimeMillis: 'number',
    totalKeysExamined: 'number',
    totalDocsExamined: 'number',
    rawExplainObject: 'object'
  },
  session: {
    initialized: {
      type: 'boolean',
      default: false
    }
  },
  derived: {
    usedIndex: {
      deps: ['rawExplainObject', 'isSharded', 'numShards'],
      fn: function() {
        var stages = this.findAllStagesByName('IXSCAN');
        var names = uniq(map(stages, 'indexName'));
        // if not all shards use an index, add `null` to the array
        if (stages.length < this.numShards) {
          names.push(null);
        }
        if (names.length === 1) {
          return names[0];
        }
        if (names.length > 1) {
          return names;
        }
        // special case for IDHACK stage, using the _id_ index.
        var idhack = this.findStageByName('IDHACK');
        return idhack ? '_id_' : null;
      }
    },
    // https://docs.mongodb.org/manual/reference/explain-results/#covered-queries
    isCovered: {
      deps: ['rawExplainObject'],
      fn: function() {
        // @todo (thomas) implement for sharded explain plans
        if (this.totalDocsExamined > 0) {
          return false;
        }
        var ixscan = this.findStageByName('IXSCAN');
        if (!ixscan) {
          return false;
        }
        return !ixscan.parentName || ixscan.parentName !== 'FETCH';
      }
    },
    isMultiKey: {
      deps: ['rawExplainObject'],
      fn: function() {
        return some(this.findAllStagesByName('IXSCAN'), function(stage) {
          return stage.isMultiKey;
        });
      }
    },
    // https://docs.mongodb.org/manual/reference/explain-results/#sort-stage
    inMemorySort: {
      deps: ['rawExplainObject'],
      fn: function() {
        return this.findAllStagesByName('SORT').length !== 0;
      }
    },
    isCollectionScan: {
      deps: ['rawExplainObject'],
      fn: function() {
        return this.findStageByName('COLLSCAN') !== null;
      }
    },
    isSharded: {
      deps: ['rawExplainObject'],
      fn: function() {
        return Boolean(this.rawExplainObject.executionStats.executionStages.shards);
      }
    },
    numShards: {
      deps: ['rawExplainObject', 'isSharded'],
      fn: function() {
        return this.isSharded ?
          this.rawExplainObject.executionStats.executionStages.shards.length : 0;
      }
    }
  },
  /**
   * Walks the tree of execution stages from a given node (or root) and returns
   * the first stage with the specified name, or null if no stage is found.
   * Equally-named children stage are traversed and returned in order.
   * Returns null if legacyMode is true.
   *
   * @param  {String} name   - name of stage to return
   * @param  {Object} root   - stage to start from. If unspecified, start from
   *                           executionStages root node.
   * @return {Object|null}   - stage object or null
   */
  findStageByName: function(name, root) {
    // not supported for legacy mode
    if (this.legacyMode) {
      return null;
    }
    var it = this._getStageIterator(root);
    for (var stage = it.next(); stage !== null; stage = it.next()) {
      if (stage.stage === name) {
        return stage;
      }
    }
    return null;
  },
  /**
   * Walks the tree of execution stages from a given node (or root) and returns
   * an array of all stages with the specified name, or null if no stage is found.
   * Returns null if legacyMode is true.
   *
   * @param  {String} name   - name of stage to return
   * @param  {Object} root   - stage to start from. If unspecified, start from
   *                           executionStages root node.
   * @return {Array|null}    - array of matching stage objects or null
   */
  findAllStagesByName: function(name, root) {
    // not supported for legacy mode
    if (this.legacyMode) {
      return null;
    }
    var arr = this._getStageArray(root);
    return filter(arr, function(stage) {
      return stage.stage === name;
    });
  },
  /**
   * pre-process explain output to match the structure of this model.
   *
   * @param  {Object} attrs  - explain plan output
   * @return {Object}        - transformed object to initialize this model
   */
  parse: function(attrs) {
    var result = {};
    assign(result, attrs.queryPlanner);
    assign(result, attrs.executionStats);
    // copy the original object into `rawExplainObject`
    result.rawExplainObject = JSON.parse(JSON.stringify(attrs));
    result.initialized = true;
    return result;
  },
  /**
   * serialize the model back into a plain javascript object.
   *
   * @return {Object}  - plain javascript object of this model
   */
  serialize: function() {
    return this.getAttributes({
      props: true, derived: true
    });
  }
});

module.exports = ExplainPlanModel;
