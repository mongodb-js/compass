var Model = require('ampersand-model');
var _ = require('lodash');

var LegacyExplainPlanModel = Model.extend({
  legacyMode: true,
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
      deps: ['rawExplainObject'],
      fn: function() {
        // for unsharded explain plan
        var mtch = this.rawExplainObject.cursor.match(/BTreeCursor (\S+)$/);
        return mtch ? mtch[1] : null;
      }
    },
    isCovered: {
      deps: ['rawExplainObject'],
      fn: function() {
        return Boolean(this.rawExplainObject.indexOnly);
      }
    },
    isMultiKey: {
      deps: ['rawExplainObject'],
      fn: function() {
        return this.rawExplainObject.isMultiKey;
      }
    },
    // https://docs.mongodb.org/manual/reference/explain-results/#sort-stage
    inMemorySort: {
      deps: ['rawExplainObject'],
      fn: function() {
        return this.rawExplainObject.scanAndOrder;
      }
    },
    isCollectionScan: {
      deps: ['rawExplainObject'],
      fn: function() {
        return this.rawExplainObject.cursor === 'BasicCursor';
      }
    },
    isSharded: {
      deps: ['rawExplainObject', 'legacyMode'],
      fn: function() {
        return Boolean(this.rawExplainObject.clusteredType);
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
    _.each(legacyMap, function(newVal, oldVal) {
      _.set(result, newVal, attrs[oldVal]);
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
    _.assign(result, this._mapLegacyFields(attrs));
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

module.exports = LegacyExplainPlanModel;
