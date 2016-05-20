var State = require('ampersand-model');
var Collection = require('ampersand-collection');
var lodashMixin = require('ampersand-collection-lodash-mixin');
var _ = require('lodash');

var debug = require('debug')('mongodb-compass:explain:stage-model');

var Stage;

var StageCollection = Collection.extend(lodashMixin, {
  model: function(attrs, options) {
    return new Stage(attrs, options);
  },
  isModel: function(model) {
    return (model instanceof Stage);
  }
});

var counter = 0;

Stage = State.extend({
  idAttribute: 'id',
  props: {
    id: {
      type: 'string',
      default: function() {
        return 'stage-' + counter++;
      }
    },
    name: 'string',
    nReturned: 'number',
    totalExecTimeMS: 'number',
    curStageExecTimeMS: 'number',
    prevStageExecTimeMS: 'number',
    details: 'object',
    x: 'number',
    y: 'number',
    depth: 'number'
  },
  derived: {
    isShard: {
      deps: ['details'],
      fn: function() {
        return !!this.details.shardName;
      }
    },
    highlightValues: {
      deps: ['name', 'details'],
      fn: function() {
        switch (this.name) {
          case 'IXSCAN': return {
            'Index Name': this.details.indexName,
            'Multi Key Index': this.details.isMultiKey
          };
          case 'PROJECTION': return {
            'Transform by': JSON.stringify(this.details.transformBy)
          };
          default: return {};
        }
      }
    },
    highlightPairs: {
      deps: ['highlightValues'],
      fn: function() {
        return _.pairs(this.highlightValues);
      }
    }
  },
  collections: {
    children: StageCollection
  },
  parse: function(attrs) {
    var parsed = {
      name: attrs.stage || attrs.shardName,
      nReturned: attrs.nReturned,
      curStageExecTimeMS: attrs.executionTimeMillisEstimate !== undefined ?
        attrs.executionTimeMillisEstimate : attrs.executionTimeMillis,
      details: _.omit(attrs, ['inputStage', 'inputStages', 'shards', 'executionStages']),
      x: attrs.x,
      y: attrs.y,
      depth: attrs.depth
    };
    if (attrs.inputStage) {
      parsed.children = [attrs.inputStage];
    } else if (attrs.inputStages || attrs.shards || attrs.executionStages) {
      parsed.children = attrs.inputStages || attrs.shards || attrs.executionStages;
    } else {
      parsed.children = [];
    }
    return parsed;
  },
  serialize: function() {
    var attrOpts = {props: true, derived: true};
    var res = this.getAttributes(attrOpts, true);
    _.forOwn(this._children, function(value, key) {
      res[key] = this[key].serialize();
    }, this);
    _.forOwn(this._collections, function(value, key) {
      res[key] = this[key].serialize();
    }, this);
    return res;
  }
});

module.exports = Stage;
module.exports.Collection = StageCollection;
