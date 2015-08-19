var Model = require('ampersand-model');
var EJSON = require('mongodb-extended-json');
var Query = require('mongodb-language-model').Query;
var _ = require('lodash');

var debug = require('debug')('scout:models:query-options');

var DEFAULT_SORT = {
  $natural: -1
};
var DEFAULT_LIMIT = 100;
var DEFAULT_SKIP = 0;

var getDefaultQuery = function() {
  return new Query({}, {
    parse: true
  });
};

/**
 * Options for reading a collection of documents from MongoDB.
 */
var QueryOptions = module.exports = Model.extend({
  props: {
    query: {
      type: 'state',
      default: function() {
        return getDefaultQuery();
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
      cache: false,
      fn: function() {
        return EJSON.stringify(this.query.serialize());
      }
    }
  },
  initialize: function() {
    this.on('change:queryString', function() {
      debug('queryString changed', this.queryString);
    });
  },
  serialize: function() {
    var res = Model.prototype.serialize.call(this);
    res.query = this.query.serialize();
    return res;
  },
  reset: function() {
    this.set({
      query: getDefaultQuery(),
      sort: DEFAULT_SORT,
      limit: DEFAULT_LIMIT,
      skip: DEFAULT_SKIP
    });
    this.trigger('reset', this);
  }
});
