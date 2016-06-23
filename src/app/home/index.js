var View = require('ampersand-view');
var format = require('util').format;
var SidebarView = require('../sidebar');
var CollectionView = require('./collection');
var InstancePropertyView = require('./instance-properties');
var CollectionListItemView = require('./collection-list-item');
var TourView = require('../tour');
var NetworkOptInView = require('../network-optin');
var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();
var _ = require('lodash');
var debug = require('debug')('mongodb-compass:home');
var toNS = require('mongodb-ns');
var ipc = require('hadron-ipc');

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
    this.listenTo(app.instance, 'sync', this.onInstanceFetched);
    this.listenTo(app.connection, 'change:name', this.updateTitle);
    ipc.on('window:show-compass-tour', this.showTour.bind(this, true));
    ipc.on('window:show-network-optin', this.showOptIn.bind(this));

    this.once('change:rendered', this.onRendered);
    debug('fetching instance model...');
    app.instance.fetch();
  },
  render: function() {
    this.renderWithTemplate(this);
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
    if (app.isFeatureEnabled('treasureHunt')) {
      return;
    }
    var networkOptInView = new NetworkOptInView();
    this.renderSubview(networkOptInView, this.queryByHook('optin-container'));
  },
  tourClosed: function() {
    // treasure hunt enables metrics
    if (app.isFeatureEnabled('treasureHunt')) {
      app.preferences.trackUsageStatistics = true;
      app.preferences.enableFeedbackPanel = true;
      app.preferences.trackErrors = true;
      debug('Treasure Hunt enabled');

      // trigger treasure hunt `stage1` event
      metrics.track('Treasure Hunt', 'stage1', {
        achievement: 'entered The Lost Temple',
        time: new Date()
      });
    }
    app.preferences.unset('showFeatureTour');
    app.preferences.save();
    if (!app.preferences.showedNetworkOptIn) {
      this.showOptIn();
    }
  },
  onInstanceFetched: function() {
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
    if (!this.ns) {
      app.instance.collections.unselectAll();
      if (app.instance.collections.length === 0) {
        this.showNoCollectionsZeroState = true;
      } else {
        this.showDefaultZeroState = true;
      }
    } else {
      this.showCollection(app.instance.collections.get(this.ns));
    }
  },
  updateTitle: function(model) {
    var title = 'MongoDB Compass - ' + app.connection.instance_id;
    if (model) {
      title += '/' + model.getId();
    }
    document.title = title;
  },
  showCollection: function(model) {
    // get the equivalent collection model that's nested in the
    // db/collection hierarchy under app.instance.databases[].collections[]
    var ns = toNS(model.getId());
    model = app.instance
      .databases.get(ns.database)
      .collections.get(ns.ns);

    var collection = app.instance.collections;
    if (!collection.select(model)) {
      return debug('already selected %s', model);
    }

    this.ns = model.getId();
    this.updateTitle(model);
    this.showNoCollectionsZeroState = false;
    this.showDefaultZeroState = false;
    app.navigate(format('schema/%s', model.getId()), {
      silent: true
    });
  },
  onClickShowConnectWindow: function() {
    // code to close current connection window and open connect dialog
    ipc.call('app:show-connect-window');
    window.close();
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
    },
    sidebar: {
      hook: 'sidebar',
      prepareView: function(el) {
        return new SidebarView({
          el: el,
          parent: this,
          filterEnabled: true,
          displayProp: '_id',
          icon: 'fa-database',
          widgets: [{
            viewClass: InstancePropertyView,
            options: {
              instance: app.instance
            }
          }],
          nested: {
            itemViewClass: CollectionListItemView,
            collectionName: 'collections',
            displayProp: 'name'
          },
          collection: app.instance.databases
        }).on('show', this.showCollection.bind(this));
      }
    }
  }
});

module.exports = HomeView;
