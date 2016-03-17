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

var indexTemplate = require('../templates').home.index;

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
    this.listenTo(app, 'show-compass-tour', this.showTour.bind(this, true));
    this.listenTo(app, 'show-network-optin', this.showOptIn);

    this.once('change:rendered', this.onRendered);
    debug('fetching instance model...');
    app.instance.fetch();
    app.sendMessage('show compass overview submenu');
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
    debug('app.instance fetched', app.instance.serialize());
    if (app.instance.collections.length === 0) {
      this.showNoCollectionsZeroState = true;
    } else {
      this.showDefaultZeroState = true;
    }
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
    var title = 'MongoDB Compass - Schema - ' + app.connection.instance_id;
    if (model) {
      title += '/' + model.getId();
    }
    document.title = title;
  },
  showCollection: function(model) {
    var collection = app.instance.collections;
    if (!collection.select(model)) {
      return debug('already selected %s', model);
    }

    this.ns = model.getId();
    this.updateTitle(model);
    this.showDefaultZeroState = false;
    app.navigate(format('schema/%s', model.getId()), {
      silent: true
    });
  },
  onClickShowConnectWindow: function() {
    // code to close current connection window and open connect dialog
    app.sendMessage('show connect dialog');
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
