var View = require('ampersand-view');
var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:home');
var React = require('react');
var ReactDOM = require('react-dom');

var indexTemplate = require('./index.jade');

var HomeView = View.extend({
  screenName: 'Schema',
  initialize: function() {
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
    this.homeView = app.appRegistry.getComponent('Home.Home');

    this.once('change:rendered', this.onRendered);
    debug('fetching instance model...');
    app.instance.fetch();
  },
  render: function() {
    this.renderWithTemplate(this);
    // @KeyboardPirate running react Home through here because fetching instance is hard to work with
    ReactDOM.render(
        React.createElement(this.homeView),
        this.queryByHook('home-content'));
  },
  onInstanceFetched: function() {
    // TODO: Remove this line
    // Instead, set the instance inside InstanceStore.refreshInstance
    app.appRegistry.getAction('App.InstanceActions').setInstance(app.instance);
    debug('app.instance fetched', app.instance.serialize());
    metrics.track('Deployment', 'detected', {
      'databases count': app.instance.databases.length,
      'namespaces count': app.instance.collections.length,
      'mongodb version': app.instance.build.version,
      'enterprise module': app.instance.build.enterprise_module,
      'longest database name length': _.max(app.instance.databases.map(function(db) {
        return db._id.length;
      })),
      'longest collection name length': _.max(app.instance.collections.map(function(col) {
        return col._id.split('.')[1].length;
      })),
      'server architecture': app.instance.host.arch,
      'server cpu cores': app.instance.host.cpu_cores,
      'server cpu frequency (mhz)': app.instance.host.cpu_frequency / 1000 / 1000,
      'server memory size (gb)': app.instance.host.memory_bits / 1024 / 1024 / 1024
    });
  },
  template: indexTemplate
});

module.exports = HomeView;
