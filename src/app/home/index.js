var View = require('ampersand-view');
var format = require('util').format;
// var IdentifyView = require('../identify');
var CollectionView = require('./collection');
var { NamespaceStore } = require('hadron-reflux-store');
var TourView = require('../tour');
var NetworkOptInView = require('../network-optin');
var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:home');
var toNS = require('mongodb-ns');
var ipc = require('hadron-ipc');
var React = require('react');
var ReactDOM = require('react-dom');

var indexTemplate = require('./index.jade');

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
    showDefaultZeroState: {
      type: 'boolean',
      default: false
    },
    showNoCollectionsZeroState: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    showDefaultZeroState: {
      hook: 'report-zero-state',
      type: 'booleanClass',
      no: 'hidden'
    },
    showNoCollectionsZeroState: {
      hook: 'no-collections-zero-state',
      type: 'booleanClass',
      no: 'hidden'
    }
  },
  events: {
    'click a.show-connect-window': 'onClickShowConnectWindow'
  },
  initialize: function() {
    /**
     * TODO (imlucas) Handle state when rtss permissions not available.
     */
    this.serverStatsView = app.appRegistry.getComponent('RTSS.ServerStats');
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
    this.listenTo(app.connection, 'change:name', this.updateTitle);
    app.home = this;

    if (this.ns) {
      NamespaceStore.ns = this.ns;
      debug('set ns to NamespaceStore.ns');
    }

    NamespaceStore.listen(this.onNamespaceChange.bind(this));
    ipc.on('window:show-compass-tour', this.showTour.bind(this, true));
    ipc.on('window:show-network-optin', this.showOptIn.bind(this));

    this.once('change:rendered', this.onRendered);
    debug('fetching instance model...');
    document.title = 'MongoDB Compass';
    app.instance.fetch();
  },
  render: function() {
    debug('rendering with ns', NamespaceStore.ns);
    this.renderWithTemplate(this);

    if (!NamespaceStore.ns) {
      var containerNode = this.queryByHook('report-zero-state');
      ReactDOM.render(
        React.createElement(this.serverStatsView, { interval: 1000 }),
        containerNode
      );
      NamespaceStore.listen(() => {
        ReactDOM.unmountComponentAtNode(containerNode);
      });
    }

    const SideBarComponent = app.appRegistry.getComponent('Sidebar.Component');
    ReactDOM.render(
      React.createElement(SideBarComponent),
      this.queryByHook('sidebar')
    );

    if (app.preferences.showFeatureTour) {
      this.showTour(false);
    } else {
      this.tourClosed();
    }
  },
  showTour: function(force) {
    var tourView = new TourView({force: force});
    if (tourView.features.length > 0) {
      tourView.on('close', this.tourClosed.bind(this));
      this.renderSubview(tourView, this.queryByHook('tour-container'));
    } else {
      this.tourClosed();
    }
  },
  showOptIn: function() {
    var networkOptInView = new NetworkOptInView();
    this.renderSubview(networkOptInView, this.queryByHook('optin-container'));
  },
  tourClosed: function() {
    app.preferences.unset('showFeatureTour');
    app.preferences.save();
    if (!app.preferences.showedNetworkOptIn) {
      this.showOptIn();
    }
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

    const model = this._getCollection();
    // When the current collection no longer exists
    if (NamespaceStore.ns && !model) {
      NamespaceStore.ns = null;
    }
    this.onNamespaceChange();
  },
  updateTitle: function(model) {
    var title = 'MongoDB Compass - ' + app.connection.instance_id;
    if (model) {
      title += '/' + model.getId();
    }
    document.title = title;
  },
  _getCollection() {
    // get the equivalent collection model that's nested in the
    // db/collection hierarchy under app.instance.databases[].collections[]
    if (!NamespaceStore.ns) {
      debug('No selected namespace');
      return null;
    }

    const ns = toNS(NamespaceStore.ns);

    const database = app.instance.databases.get(ns.database);

    if (!database) {
      return null;
    }

    return database.collections.get(ns.ns);
  },
  onNamespaceChange: function() {
    debug('onNamespaceChange');
    if (!NamespaceStore.ns) {
      debug('no namespace set.  resetting');
      app.instance.collections.unselectAll();
      if (app.instance.collections.length === 0) {
        this.showNoCollectionsZeroState = true;
      } else {
        this.showDefaultZeroState = true;
      }
    }

    const model = this._getCollection();

    if (!model) {
      debug('Unknown ns %s. Redirecting to index', NamespaceStore.ns);
      app.navigate('/', {
        params: {
          connectionId: app.connection.getId()
        }
      });
      return;
    }

    this.showNoCollectionsZeroState = false;
    this.showDefaultZeroState = false;

    debug('showNoCollectionsZeroState to false');
    debug('showDefaultZeroState to false');

    const collection = app.instance.collections;
    if (!collection.select(model)) {
      return debug('already selected %s', model);
    }

    debug('updating title');
    this.updateTitle(model);

    this._subviews[0].onCollectionChanged();

    debug('pushing state into URL so window reload works');
    app.navigate(format('schema/%s', model.getId()), {
      silent: true,
      params: {
        connectionId: app.connection.getId()
      }
    });
  },
  onClickShowConnectWindow: function() {
    app.navigate('/connect');
  },
  template: indexTemplate,
  subviews: {
    _collection: {
      hook: 'collection-subview',
      prepareView: function(el) {
        return new CollectionView({
          el: el,
          parent: this
        });
      }
    }
  }
});

module.exports = HomeView;
