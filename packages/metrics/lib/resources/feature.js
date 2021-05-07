var BaseResource = require('./base');

// var debug = require('debug')('mongodb-js-metrics:resources:app');

module.exports = BaseResource.extend({
  id: 'Feature',
  used: function(metadata, callback) {
    metadata = metadata || {};
    this._send_event(metadata, callback);
  }
});
