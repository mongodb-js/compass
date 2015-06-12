var AmpersandState = require('ampersand-state');
var app = require('ampersand-app');
var TheQueryBar = require('the-query-bar/models');

module.exports = AmpersandState.extend({
  props: {
    sort: {
      type: 'object',
      default: function() {
        return {
          '_id': -1
        };
      }
    },
    limit: {
      type: 'number',
      default: 10000,
    },
    skip: {
      type: 'number',
      default: 0
    }
  },
  children: {
    query: TheQueryBar.Query
  },
  derived: {
    queryString: {
      deps: ['query'],
      fn: function() {
        return JSON.stringify(this.query);
      }
    }
  }
});

