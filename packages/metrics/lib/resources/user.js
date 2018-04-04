var BaseResource = require('./base');

// var debug = require('debug')('mongodb-js-metrics:resources:app');

module.exports = BaseResource.extend({
  id: 'User',
  props: {
    userId: {
      type: 'string',
      required: true
    },
    createdAt: ['date', true],
    name: 'string',
    email: 'string',
    developer: 'boolean',
    twitter: 'string'
  },
  login: function(options, callback) {
    this._send_event(options, callback);
  }
});
