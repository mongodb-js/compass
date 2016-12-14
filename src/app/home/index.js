var View = require('ampersand-view');
// var format = require('util').format;
// var IdentifyView = require('../identify');
var { NamespaceStore } = require('hadron-reflux-store');
var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:home');
var toNS = require('mongodb-ns');
var React = require('react');
var ReactDOM = require('react-dom');

var indexTemplate = require('./index.jade');

/**
 * Ampersand view wrapper around a React component tab view
 */
var WrapperView = View.extend({
  template: '<div></div>',
  props: {
    componentKey: 'string',
    visible: {
      type: 'boolean',
      required: true,
      default: false
    }
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  render: function() {
    this.renderWithTemplate();
    var component = app.appRegistry.getComponent(this.componentKey);
    ReactDOM.render(React.createElement(component), this.query());
  }
});

var HomeView = View.extend({
  screenName: 'Schema',
  props: {
    switcher: {
      type: 'object',
      default: null
    },
    ns: {
      type: 'string',
      allowNull: true,
      default: null
    },
    /**
     * TODO (imlucas) Is this deprecated with rtss?
     */
    showDefaultZeroState: {
      type: 'boolean',
      default: false
    }
  },
  initialize: function() {
    /**
     * TODO (imlucas) Handle state when rtss permissions not available.
     */
    this.serverStatsView = app.appRegistry.getComponent('RTSS.ServerStats');
    this.collectionsTable = app.appRegistry.getComponent('Database.CollectionsTable');
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
    this.listenTo(app.connection, 'change:name', this.updateTitle);
    NamespaceStore.listen(this.switchMainContent.bind(this));

    this.once('change:rendered', this.onRendered);
    debug('fetching instance model...');
    document.title = 'MongoDB Compass';
    app.instance.fetch();
  },
  render: function() {
    this.renderWithTemplate(this);
    const SideBarComponent = app.appRegistry.getComponent('Sidebar.Component');
    ReactDOM.render(
      React.createElement(SideBarComponent),
      this.queryByHook('sidebar')
    );
    this.switchMainContent('');
  },
  switchMainContent: function(namespace) {
    if (namespace === this.ns) {
      debug('already selected namespace', namespace);
      return;
    }
    this.ns = namespace;
    const ns = toNS(namespace);
    var containerNode = this.queryByHook('report-zero-state');

    if (ns.database === '') {
      // neither database nor collection are present, top level instance view
      ReactDOM.render(
        React.createElement(this.serverStatsView, {interval: 1000}),
        containerNode
      );
    } else if (ns.collection === '') {
      // a database was clicked, render collections table
      ReactDOM.render(
        React.createElement(this.collectionsTable),
        containerNode
      );
    } else {
      // unmount instance/databases view and switch to collection view
      ReactDOM.unmountComponentAtNode(containerNode);
    }
    this.updateTitle(namespace);
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

    if (!NamespaceStore.ns) {
      app.instance.collections.unselectAll();
      if (app.instance.collections.length === 0) {
        // NOTE: Now handled by the Databases tab
        // this.showNoCollectionsZeroState = true;
      } else {
        this.showDefaultZeroState = true;
      }
    }
  },
  updateTitle: function(ns) {
    var title = 'MongoDB Compass - ' + app.connection.instance_id;
    if (ns) {
      title += '/' + ns;
    }
    document.title = title;
  },
  _getCollection() {
    // get the equivalent collection model that's nested in the
    // db/collection hierarchy under app.instance.databases[].collections[]
    if (!NamespaceStore.ns) {
      return null;
    }

    const ns = toNS(NamespaceStore.ns);

    const database = app.instance.databases.get(ns.database);

    if (!database) {
      return null;
    }

    return database.collections.get(ns.ns);
  },
  template: indexTemplate,
  subviews: {
    collectionView: {
      hook: 'collection-view',
      prepareView: function(el) {
        return new WrapperView({
          el: el,
          parent: this,
          visible: true,
          componentKey: 'Collection.Collection'
        });
      }
    }
  }
});

module.exports = HomeView;
