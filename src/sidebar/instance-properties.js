var View = require('ampersand-view');
var app = require('ampersand-app');
// var debug = require('debug')('scout:sidebar:instace-properties');

var InstancePropertiesView = module.exports = View.extend({
  template: require('./instance-properties.jade'),
  session: {
    hostname: 'string',
    version: 'string',
    numDatabases: 'number',
    numCollections: 'number',
    instance: 'state'
  },
  bindings: {
    'instance.host.hostname': {
      type: 'text',
      hook: 'hostname'
    },
    'instance.build.version': {
      type: 'text',
      hook: 'version'
    },
    numCollections: {
      type: 'text',
      hook: 'num-collections'
    },
    numDatabases: {
      type: 'text',
      hook: 'num-databases'
    }
  },
  initialize: function() {
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
  },
  onInstanceFetched: function() {
    this.numDatabases = app.instance.databases.length;
    this.numCollections = app.instance.collections.length;
  }
});

module.exports = InstancePropertiesView;
