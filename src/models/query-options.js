var Model = require('ampersand-model');
var EJSON = require('mongodb-extended-json');
var Query = require('mongodb-language-model').Query;
// var debug = require('debug')('scout:models:query-options');

var DEFAULT_SORT = {
  _id: -1
};
var DEFAULT_SIZE = 100;
var DEFAULT_SKIP = 0;

var getDefaultQuery = function() {
  return new Query({}, {
    parse: true
  });
};

/**
 * Options for reading a collection of documents from MongoDB.
 */
module.exports = Model.extend({
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
    size: {
      type: 'number',
      default: DEFAULT_SIZE
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
  serialize: function() {
    var res = Model.prototype.serialize.call(this);
    res.query = this.query.serialize();
    return res;
  },
  reset: function() {
    this.set({
      query: getDefaultQuery(),
      sort: DEFAULT_SORT,
      size: DEFAULT_SIZE,
      skip: DEFAULT_SKIP
    });
    this.trigger('reset', this);
  }
});
