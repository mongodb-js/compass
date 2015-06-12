var AmpersandState = require('ampersand-state');
var app = require('ampersand-app');

module.exports = AmpersandState.extend({
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
  derived: {
    queryString: {
      deps: ['query'],
      fn: function() {
        return JSON.stringify(this.query);
      }
    }
  }
});

