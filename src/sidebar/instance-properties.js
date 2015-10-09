var View = require('ampersand-view');
var app = require('ampersand-app');
// var debug = require('debug')('scout:sidebar:instace-properties');
var _ = require('lodash');

var InstancePropertiesView = module.exports = View.extend({
  template: require('./instance-properties.jade'),
  session: {
    hostname: 'string',
    version: 'string',
    numDatabases: 'number',
    numCollections: 'number',
    instance: 'state',
    is_fetching: {
      type: 'boolean',
      default: true
    }
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
    },
    is_fetching: {
      type: 'booleanClass',
      hook: 'refresh-icon',
      yes: ['fa-refresh', 'fa-spin'],
      no: 'fa-repeat'
    }
  },
  events: {
    'click button[data-hook=refresh-button]': 'onRefreshButtonClicked'
  },
  initialize: function() {
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
  },
  onInstanceFetched: function() {
    // delay switching the spinner back to static for 500ms, otherwise the reload is not noticable
    _.delay(function() {
      this.is_fetching = false;
    }.bind(this), 500);
    this.numDatabases = app.instance.databases.length;
    this.numCollections = app.instance.collections.length;
  },
  onRefreshButtonClicked: function() {
    app.instance.fetch();
    this.is_fetching = true;
  }
});

module.exports = InstancePropertiesView;
