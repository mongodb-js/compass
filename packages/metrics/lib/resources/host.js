var BaseResource = require('./base');
var _ = require('lodash');
var os = (typeof window === 'undefined') ?
  require('os') : window.require('remote').require('os');

// var debug = require('debug')('mongodb-js-metrics:resources:app');

module.exports = BaseResource.extend({
  id: 'Host',
  props: {
    hostArchitecture: ['string', false],
    hostCPUCores: ['number', false],
    hostCPUFreqMHz: ['number', false],
    hostMemoryTotalGB: ['number', false],
    hostMemoryFreeGB: ['number', false]
  },
  initialize: function() {
    BaseResource.prototype.initialize.apply(this, arguments);
    this.set({
      hostArchitecture: os.arch(),
      hostCPUCores: os.cpus().length,
      hostCPUFreqMHz: _.get(os.cpus()[0], 'speed', 0),
      hostMemoryTotalGB: os.totalmem() / 1024 / 1024 / 1024,
      hostMemoryFreeGB: os.freemem() / 1024 / 1024 / 1024
    });
  }
});
