var Model = require('ampersand-model');
var EJSON = require('mongodb-extended-json');

var DEFAULT_QUERY = {};
var DEFAULT_SORT = {
  $natural: -1
};
var DEFAULT_LIMIT = 100;
var DEFAULT_SKIP = 0;

/**
 * Options for reading a collection of documents from MongoDB.
 */
module.exports = Model.extend({
  props: {
    query: {
      type: 'object',
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
    limit: {
      type: 'number',
      default: DEFAULT_LIMIT
    },
    skip: {
      type: 'number',
      default: DEFAULT_SKIP
    }
  },
  derived: {
    queryString: {
      deps: ['query'],
      fn: function() {
        return EJSON.stringify(this.query);
      }
    }
  },
  reset: function() {
    this.set({
      query: DEFAULT_QUERY,
      sort: DEFAULT_SORT,
      limit: DEFAULT_LIMIT,
      skip: DEFAULT_SKIP
    });
    this.trigger('reset', this);
  }
});
