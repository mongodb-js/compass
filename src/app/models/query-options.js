var ms = require('ms');
var Model = require('ampersand-model');
var EJSON = require('mongodb-extended-json');
// var debug = require('debug')('mongodb-compass:models:query-options');

var DEFAULT_QUERY = {};
var DEFAULT_SORT = {
  _id: -1
};
var DEFAULT_SIZE = 1000;
var DEFAULT_SKIP = 0;
var DEFAULT_MAX_TIME_MS = ms('10 seconds');

/**
 * Options for reading a collection of documents from MongoDB.
 */
module.exports = Model.extend({
  props: {
    query: {
      type: 'state',
      default: function() {
        return DEFAULT_QUERY;
      }
    },
    sort: {
      type: 'object',
      default: function() {
        return DEFAULT_SORT;
      }
    },
    size: {
      type: 'number',
      default: DEFAULT_SIZE
    },
    skip: {
      type: 'number',
      default: DEFAULT_SKIP
    },
    maxTimeMS: {
      type: 'number',
      default: DEFAULT_MAX_TIME_MS
    }
  },
  derived: {
    queryString: {
      deps: ['query'],
      cache: false,
      fn: function() {
        return EJSON.stringify(this.query);
      }
    }
  },
  serialize: function() {
    var res = Model.prototype.serialize.call(this);
    res.query = this.query;
    return res;
  },
  reset: function() {
    this.set({
      query: DEFAULT_QUERY,
      sort: DEFAULT_SORT,
      size: DEFAULT_SIZE,
      skip: DEFAULT_SKIP,
      maxTimeMS: DEFAULT_MAX_TIME_MS
    });
    this.trigger('reset', this);
  }
});

module.exports.DEFAULT_QUERY = DEFAULT_QUERY;
module.exports.DEFAULT_SORT = DEFAULT_SORT;
module.exports.DEFAULT_SIZE = DEFAULT_SIZE;
module.exports.DEFAULT_SKIP = DEFAULT_SKIP;
module.exports.DEFAULT_MAX_TIME_MS = DEFAULT_MAX_TIME_MS;
