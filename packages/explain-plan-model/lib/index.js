var Model = require('ampersand-model');
var assign = require('lodash.assign');
var set = require('lodash.set');
var each = require('lodash.foreach');

var stageIterationMixin = require('./stage-iteration');

// var debug = require('debug')('mongodb-explain-plan-model');

var ExplainPlanModel = Model.extend(stageIterationMixin, {
  extraProperties: 'ignore',
  props: {
    namespace: 'string',
    parsedQuery: 'object',
    executionSuccess: 'boolean',
    nReturned: 'number',
    executionTimeMillis: 'number',
    totalKeysExamined: 'number',
    totalDocsExamined: 'number',
    rawExplainObject: 'object',
    legacyMode: {
      type: 'boolean',       // true if ingested from 2.6 or before version
      required: true,
      default: false
    }
  },
  derived: {
    usedIndex: {
      deps: ['rawExplainObject', 'legacyMode'],
      fn: function() {
        if (this.legacyMode) {
          var mtch = this.rawExplainObject.cursor.match(/BTreeCursor (\S+)$/);
          return mtch ? mtch[1] : null;
        }
        var ixscan = this._findStageByName('IXSCAN');
        return ixscan ? ixscan.indexName : null;
      }
    },
    // https://docs.mongodb.org/manual/reference/explain-results/#covered-queries
    isCovered: {
      deps: ['rawExplainObject', 'legacyMode'],
      fn: function() {
        if (this.legacyMode) {
          return Boolean(this.rawExplainObject.indexOnly);
        }
        if (this.totalDocsExamined > 0) {
          return false;
        }
        var ixscan = this._findStageByName('IXSCAN');
        return !ixscan.parent || ixscan.parent.stage !== 'FETCH';
      }
    },
    isMultiKey: {
      deps: ['rawExplainObject', 'legacyMode'],
      fn: function() {
        if (this.legacyMode) {
          return this.rawExplainObject.isMultiKey;
        }
        var ixscan = this._findStageByName('IXSCAN');
        return Boolean(ixscan && ixscan.isMultiKey);
      }
    },
    // https://docs.mongodb.org/manual/reference/explain-results/#sort-stage
    inMemorySort: {
      deps: ['rawExplainObject', 'legacyMode'],
      fn: function() {
        if (this.legacyMode) {
          return this.rawExplainObject.scanAndOrder;
        }
        return this._findStageByName('SORT') !== null;
      }
    },
    isCollectionScan: {
      deps: ['rawExplainObject', 'legacyMode'],
      fn: function() {
        if (this.legacyMode) {
          return this.rawExplainObject.cursor === 'BasicCursor';
        }
        return this._findStageByName('COLLSCAN') !== null;
      }
    }
  },
  /**
   * extracts basic information from older (2.6 and prior) explain plan
   * versions and transforms them into the shape of a 3.0+ explain output.
   *
   * @param  {Object} attrs  - legacy explain plan object
   * @return {Object}        - new explain plan object
   */
  _mapLegacyFields: function(attrs) {
    var legacyMap = {
      n: 'nReturned',
      nscanned: 'totalKeysExamined',
      nscannedObjects: 'totalDocsExamined',
      millis: 'executionTimeMillis',
      indexOnly: 'coveredQuery'
    };
    var result = {};
    each(legacyMap, function(newVal, oldVal) {
      set(result, newVal, attrs[oldVal]);
    });
    return result;
  },
  /**
   * pre-process explain output to match the structure of this model.
   *
   * @param  {Object} attrs  - explain plan output
   * @return {Object}        - transformed object to initialize this model
   */
  parse: function(attrs) {
    var result = {};
    if (attrs.cursor) {
      // 2.6 or prior explain output, switch to legacy mode
      result.legacyMode = true;
      assign(result, this._mapLegacyFields(attrs));
    } else {
      result.legacyMode = false;
      assign(result, attrs.queryPlanner);
      assign(result, attrs.executionStats);
    }
    // copy the original object into `rawExplainObject`
    result.rawExplainObject = JSON.parse(JSON.stringify(attrs));
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
