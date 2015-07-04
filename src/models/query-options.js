var Model = require('ampersand-model');
var EJSON = require('mongodb-extended-json');

/**
 * Options for reading a collection of documents from MongoDB.
 */
module.exports = Model.extend({
  props: {
    query: {
      type: 'object',
      default: function() {
        return {};
      }
    },
    sort: {
      type: 'object',
      default: function() {
        return {
          _id: -1
        };
      }
    },
    limit: {
      type: 'number',
      default: 10000
    },
    skip: {
      type: 'number',
      default: 0
    }
  },
  derived: {
    queryString: {
      deps: ['query'],
      fn: function() {
        return EJSON.stringify(this.query);
      }
    }
  }
});
